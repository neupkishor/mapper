# Configuration-Based Mapper System

This document describes the new configuration-based approach for the @neupgroup/mapper system.

## Overview

The configuration-based mapper allows you to define all your database and API connections in a single configuration object or file, rather than manually configuring each connection and schema individually.

## Features

- **Centralized Configuration**: Define all connections and schemas in one place
- **Multiple Connection Types**: Support for SQL, MySQL, MongoDB, Firestore, and API connections
- **Auto-Configuration**: Automatically load configuration from environment variables or default file locations
- **Backward Compatible**: Existing mapper usage continues to work unchanged
- **Type Safe**: Full TypeScript support with proper type definitions

## Quick Start

### 1. Using Configuration Object

```typescript
import { createConfigMapper } from '@neupgroup/mapper';

const config = {
  connections: [
    {
      name: 'users_db',
      type: 'sql',
      host: 'localhost',
      port: 5432,
      database: 'users',
      user: 'postgres',
      password: 'password'
    },
    {
      name: 'products_api',
      type: 'api',
      url: 'https://api.example.com/products',
      headers: {
        'Authorization': 'Bearer token123'
      }
    }
  ],
  schemas: [
    {
      name: 'users',
      connection: 'users_db',
      collection: 'users',
      structure: {
        'id': 'int auto_increment',
        'name': 'string editable',
        'email': 'string editable'
      }
    }
  ]
};

const mapper = createConfigMapper(config);

// Use the configured mapper
const users = await mapper.get('users');
```

### 2. Using Configuration File

Create a `mapper.config.json` file:

```json
{
  "connections": [
    {
      "name": "my_database",
      "type": "sql",
      "host": "localhost",
      "port": 5432,
      "database": "myapp",
      "user": "postgres",
      "password": "password"
    }
  ],
  "schemas": [
    {
      "name": "users",
      "connection": "my_database",
      "collection": "users",
      "structure": {
        "id": "int auto_increment",
        "name": "string editable",
        "email": "string editable"
      }
    }
  ]
}
```

Then load it:

```typescript
import { createConfigMapper } from '@neupgroup/mapper';

const mapper = createConfigMapper().configureFromFile('./mapper.config.json');
```

### 3. Auto-Configuration

The mapper can automatically load configuration from:
- Environment variable `MAPPER_CONFIG`
- Default config files: `./mapper.config.json`, `./config/mapper.json`, `/etc/mapper/config.json`
- Database URL from `DATABASE_URL` environment variable

```typescript
import { createDefaultMapper } from '@neupgroup/mapper';

// Automatically loads configuration
const mapper = createDefaultMapper();

// Ready to use!
const users = await mapper.get('users');
```

## Configuration Format

### Database Connections

```typescript
interface DatabaseConnectionConfig {
  name: string;           // Unique connection name
  type: 'mysql' | 'sql' | 'firestore' | 'mongodb';
  host: string;          // Database host
  port: number;          // Database port
  database: string;      // Database name
  user: string;          // Username
  password?: string;     // Password (optional)
  ssl?: boolean;         // SSL connection (optional)
  [key: string]: any;    // Additional connection parameters
}
```

### API Connections

```typescript
interface ApiConnectionConfig {
  name: string;          // Unique connection name
  type: 'api';
  url: string;           // API base URL
  headers?: Record<string, string>;  // Default headers
  timeout?: number;      // Request timeout
  [key: string]: any;    // Additional API parameters
}
```

### Schemas

```typescript
interface ConfigSchema {
  name: string;          // Schema name
  connection: string;    // Connection name to use
  collection: string;    // Collection/table name
  structure?: Record<string, string> | Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'int';
    [key: string]: any;
  }>;  // Field definitions
}
```

## Migration from Direct Mapper

### Before (Direct Mapper)

```typescript
import Mapper from '@neupgroup/mapper';

const mapper = Mapper;
mapper.connect('mydb', 'sql', {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

mapper.schema('users')
  .use({ connection: 'mydb', collection: 'users' })
  .setStructure({
    'id': 'int auto_increment',
    'name': 'string editable',
    'email': 'string editable'
  });

const users = await mapper.get('users', { name: 'John' });
```

### After (Config-Based)

```typescript
import { createConfigMapper } from '@neupgroup/mapper';

const config = {
  connections: [
    {
      name: 'mydb',
      type: 'sql',
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      user: 'postgres',
      password: 'password'
    }
  ],
  schemas: [
    {
      name: 'users',
      connection: 'mydb',
      collection: 'users',
      structure: {
        'id': 'int auto_increment',
        'name': 'string editable',
        'email': 'string editable'
      }
    }
  ]
};

const mapper = createConfigMapper(config);

// Same API!
const users = await mapper.get('users', { name: 'John' });
```

## Advanced Usage

### Dynamic Configuration Loading

```typescript
import { getConfigMapper } from '@neupgroup/mapper';

// Get the global config mapper instance
const mapper = getConfigMapper();

// Load configuration at runtime
mapper.configure({
  connections: [
    // ... your connections
  ],
  schemas: [
    // ... your schemas
  ]
});
```

### Environment-Based Configuration

```typescript
import { createDefaultMapper } from '@neupgroup/mapper';

// Set MAPPER_CONFIG environment variable
process.env.MAPPER_CONFIG = JSON.stringify({
  connections: [
    {
      name: 'production_db',
      type: 'sql',
      host: process.env.DB_HOST,
      port: 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  ],
  schemas: [
    // ... your schemas
  ]
});

const mapper = createDefaultMapper();
```

## Examples

See the `/examples` directory for complete working examples:
- `config-usage-example.ts` - Basic configuration usage
- `auto-config-example.ts` - Auto-configuration
- `file-config-example.ts` - File-based configuration
- `migration-guide.ts` - Migration from direct mapper

## API Reference

### Functions

- `createConfigMapper(config?: MapperConfig): ConfigBasedMapper` - Create a new configured mapper
- `createDefaultMapper(config?: MapperConfig): ConfigBasedMapper` - Create mapper with auto-configuration
- `getConfigMapper(): ConfigBasedMapper` - Get the global config mapper instance

### Classes

- `ConfigBasedMapper` - The main configuration-based mapper class
- `ConfigLoader` - Configuration loading utility

### Types

- `MapperConfig` - Main configuration interface
- `ConnectionConfig` - Connection configuration union type
- `DatabaseConnectionConfig` - Database connection configuration
- `ApiConnectionConfig` - API connection configuration
- `ConfigSchema` - Schema configuration