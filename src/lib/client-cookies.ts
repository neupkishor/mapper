"use client";

// Simple client-side cookie helpers
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEq = encodeURIComponent(name) + '=';
  const parts = document.cookie.split(';');
  for (let p of parts) {
    p = p.trim();
    if (p.startsWith(nameEq)) {
      try {
        return decodeURIComponent(p.substring(nameEq.length));
      } catch {
        return p.substring(nameEq.length);
      }
    }
  }
  return null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + d.toUTCString();
  const path = '; path=/';
  const sameSite = '; samesite=lax';
  // Not httpOnly; client needs access to clear/view
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}${path}${sameSite}`;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  const path = '; path=/';
  const sameSite = '; samesite=lax';
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${path}${sameSite}`;
}

export function getCookieNamesByPrefix(prefix: string): string[] {
  if (typeof document === 'undefined') return [];
  const names: string[] = [];
  const parts = document.cookie.split(';');
  for (let p of parts) {
    const [rawName] = p.trim().split('=');
    const name = decodeURIComponent(rawName || '');
    if (name && name.startsWith(prefix)) names.push(name);
  }
  return names;
}

// Common app keys
export const SCHEMA_COOKIE_KEY = 'collectionSchemasByConnection';
export const CONFIG_COOKIE_PREFIX = 'mapper_cfg_';

