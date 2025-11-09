import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { Firestore, initializeFirestore } from 'firebase/firestore';
import { cookies } from 'next/headers';

export type SupportedDbType = 'Firestore' | 'MongoDB' | 'SQL' | 'API';

export interface DbConfig {
  dbType: SupportedDbType;
  // Firestore
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  // API
  basePath?: string;
  headers?: { key: string; value: string }[];
  // SQL
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  // MongoDB
  connectionString?: string;
  dbName?: string;
}
// Named runtime configs, allowing multiple instances per session.
const runtimeConfigs = new Map<string, DbConfig>();

// Cookie prefixes for persisted data
const COOKIE_PREFIX_CONFIG = 'mapper_cfg_';

function getCookieKeyForConfig(name: string) {
  return `${COOKIE_PREFIX_CONFIG}${name}`;
}

function readConfigFromCookies(name: string): DbConfig | null {
  try {
    const store = cookies();
    const key = getCookieKeyForConfig(name);
    const c = store.get(key);
    if (!c?.value) return null;
    const parsed = JSON.parse(c.value);
    if (parsed && typeof parsed === 'object' && parsed.dbType) {
      return parsed as DbConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function writeConfigToCookies(name: string, config: DbConfig) {
  try {
    const store = cookies();
    const key = getCookieKeyForConfig(name);
    // Persist for ~1 year; accessible to client to allow clearing
    store.set({
      name: key,
      value: JSON.stringify(config),
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    } as any);
  } catch {
    // best-effort; ignore cookie write failures
  }
}

function deleteConfigCookie(name: string) {
  try {
    const store = cookies();
    const key = getCookieKeyForConfig(name);
    store.delete(key);
  } catch {
    // ignore
  }
}

// Firestore instances keyed by connection name (to support multiple apps)
const firestoreInstances = new Map<string, Firestore>();
const appInstances = new Map<string, FirebaseApp>();

export function setDbConfig(config: DbConfig, name: string = 'default') {
  // Allow updating existing name; newer config wins
  runtimeConfigs.set(name, config);
  writeConfigToCookies(name, config);
  // Reset caches for this connection name to re-init with new config
  firestoreInstances.delete(name);
  appInstances.delete(name);
}

export function clearDbConfig(name?: string) {
  if (!name) {
    runtimeConfigs.clear();
    firestoreInstances.clear();
    appInstances.clear();
    // remove all persisted config cookies
    try {
      const store = cookies();
      store.getAll().forEach(c => {
        if (c.name && c.name.startsWith(COOKIE_PREFIX_CONFIG)) {
          store.delete(c.name);
        }
      });
    } catch {}
    return;
  }
  runtimeConfigs.delete(name);
  firestoreInstances.delete(name);
  appInstances.delete(name);
  deleteConfigCookie(name);
}

export function listRuntimeConfigs(): string[] {
  const names = new Set<string>(runtimeConfigs.keys());
  try {
    const store = cookies();
    store.getAll().forEach(c => {
      if (c.name && c.name.startsWith(COOKIE_PREFIX_CONFIG)) {
        const n = c.name.substring(COOKIE_PREFIX_CONFIG.length);
        if (n) names.add(n);
      }
    });
  } catch {}
  return Array.from(names);
}

export function getDbConfig(name: string = 'default'): DbConfig | null {
  const runtimeConfig = runtimeConfigs.get(name);
  if (runtimeConfig) return runtimeConfig;

  // Try cookie-persisted config
  const cookieConfig = readConfigFromCookies(name);
  if (cookieConfig) return cookieConfig;

  const type = process.env.CONNECTION_TYPE as SupportedDbType | undefined;
  if (!type) {
    console.warn('CONNECTION_TYPE environment variable is not set.');
    return null;
  }

  let config: Partial<DbConfig> = { dbType: type };
  switch (type) {
    case 'Firestore':
      config = {
        ...config,
        apiKey: process.env.FIRESTORE_API_KEY,
        authDomain: process.env.FIRESTORE_AUTH_DOMAIN,
        projectId: process.env.FIRESTORE_PROJECT_ID,
        storageBucket: process.env.FIRESTORE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIRESTORE_MESSAGING_SENDER_ID,
        appId: process.env.FIRESTORE_APP_ID,
      };
      break;
    case 'API':
      const headers: { key: string; value: string }[] = [];
      for (let i = 1; i <= 3; i++) {
        const key = process.env[`API_HEADER_${i}_KEY` as const];
        const value = process.env[`API_HEADER_${i}_VALUE` as const];
        if (key && value) headers.push({ key, value });
      }
      config = {
        ...config,
        basePath: process.env.API_BASE_PATH,
        apiKey: process.env.API_KEY,
        headers,
      };
      break;
    case 'SQL':
      config = {
        ...config,
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : undefined,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DATABASE,
      };
      break;
    case 'MongoDB':
      config = {
        ...config,
        connectionString: process.env.MONGODB_CONNECTION_STRING,
        dbName: process.env.MONGODB_DB_NAME,
      };
      break;
    default:
      console.warn(`Unsupported CONNECTION_TYPE: ${type}`);
      return null;
  }
  return config as DbConfig;
}

export function getFirestoreInstance(name: string = 'default'): Firestore | null {
  const cached = firestoreInstances.get(name);
  if (cached) return cached;

  const config = getDbConfig(name);
  if (config?.dbType !== 'Firestore') return null;

  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };

  let app: FirebaseApp;
  try {
    // Use isolated app name per connection to allow multiple apps
    const appName = name === 'default' ? undefined : name;
    if (appName) {
      app = initializeApp(firebaseConfig, appName);
    } else {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
    }
  } catch (e) {
    try {
      app = getApp(name === 'default' ? undefined : name);
    } catch (err) {
      console.error('Firebase initialization error:', err);
      return null;
    }
  }

  appInstances.set(name, app);
  const fs = initializeFirestore(app, {});
  firestoreInstances.set(name, fs);
  return fs;
}

export function getApiHeaders(name: string = 'default'): Record<string, string> | null {
  const apiConfig = getDbConfig(name);
  if (!apiConfig || apiConfig.dbType !== 'API') return null;
  const { apiKey, headers: globalHeaders } = apiConfig;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
  if (globalHeaders && Array.isArray(globalHeaders)) {
    globalHeaders.forEach(h => {
      if (h.key && h.value) headers[h.key] = h.value;
    });
  }
  return headers;
}
