# @neupgroup/mapper

Schema and mapping utilities with lightweight ORM helpers. Define schemas, attach adapters per connection, and perform CRUD with a simple, fluent API.

## Installation

```bash
npm install @neupgroup/mapper
```

## 🚀 One-Import Quick Start (NEW!)

**The simplest way to get started - just import and use:**

```ts
import Mapper from '@neupgroup/mapper'

// 1. Define a schema (Mapper auto-configures with sensible defaults)
Mapper.schema('users')
  .use({ connection: 'default', collection: 'users' })
  .setStructure([
    { name: 'id', type: 'int', autoIncrement: true },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' }
  ])

// 2. Use immediately - no setup required!
await Mapper.add('users', { name: 'Alice', email: 'alice@example.com' })
const users = await Mapper.get('users')
const user = await Mapper.getOne('users', { email: 'alice@example.com' })
await Mapper.update('users', { email: 'alice@example.com' }, { name: 'Alice Cooper' })
await Mapper.delete('users', { email: 'alice@example.com' })
```

### **Auto-Configuration Magic** ✨

The Mapper automatically configures itself based on your environment:

- **Environment Variables**: `DATABASE_URL=mysql://user:pass@host:port/db`
- **Browser Global**: `window.__MAPPER_CONFIG__`
- **Default Fallback**: In-memory API connection for instant prototyping

**Connection type auto-detection:**
```
mysql://...      → MySQL
postgres://...   → PostgreSQL  
mongodb://...    → MongoDB
firestore://...  → Firestore
```

### **Manual Configuration (Optional)**

```ts
// Connect to your database
Mapper.connect('mydb', 'mysql', {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'myapp'
})

// Or use environment variables
// DATABASE_URL=mysql://root:password@localhost:3306/myapp
```

## 🛠️ Complete Usage Examples

### **Example 1: Zero-Configuration Setup**
```ts
import Mapper from '@neupgroup/mapper'

// Works immediately with in-memory storage
const users = await Mapper.get('users') // Returns empty array
```

### **Example 2: Environment-Based Configuration**
```bash
# Set environment variable
export DATABASE_URL=mysql://user:password@localhost:3306/myapp

# Or in browser
window.__MAPPER_CONFIG__ = {
  connection: {
    name: 'mydb',
    type: 'mysql',
    key: { host: 'localhost', user: 'root', password: 'pass', database: 'myapp' }
  }
}
```

```ts
import Mapper from '@neupgroup/mapper'

// Automatically configured from environment
const users = await Mapper.get('users')
```

### **Example 3: Schema with Multiple Field Types**
```ts
import Mapper from '@neupgroup/mapper'

Mapper.schema('products')
  .use({ connection: 'default', collection: 'products' })
  .setStructure([
    { name: 'id', type: 'int', autoIncrement: true },
    { name: 'name', type: 'string' },
    { name: 'price', type: 'number' },
    { name: 'inStock', type: 'boolean' },
    { name: 'createdAt', type: 'date' },
    { name: 'categoryId', type: 'int' }
  ])

// Add product
await Mapper.add('products', {
  name: 'Laptop',
  price: 999.99,
  inStock: true,
  createdAt: new Date(),
  categoryId: 1
})

// Get products with filters
const expensiveProducts = await Mapper.get('products', { price: 500 }, '>')
const inStockProducts = await Mapper.get('products', { inStock: true })
```

### **Example 4: Advanced Query Operations**
```ts
import Mapper from '@neupgroup/mapper'

// Complex queries using the underlying API
const query = Mapper.use('users')
  .where('age', 18, '>=')
  .where('status', 'active')

const activeAdults = await query.get()
const firstActiveAdult = await query.getOne()

// Update multiple records
await query.to({ lastLogin: new Date() }).update()

// Delete with complex conditions
await Mapper.use('users')
  .where('lastLogin', new Date('2023-01-01'), '<')
  .delete()
```

### **Example 5: Multiple Databases**
```ts
import Mapper from '@neupgroup/mapper'

// Connect to multiple databases
Mapper.connect('mysql_db', 'mysql', {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'main_app'
})

Mapper.connect('mongo_cache', 'mongodb', {
  uri: 'mongodb://localhost:27017',
  database: 'cache'
})

// Use different connections for different schemas
Mapper.schema('users')
  .use({ connection: 'mysql_db', collection: 'users' })
  .setStructure([...])

Mapper.schema('sessions')
  .use({ connection: 'mongo_cache', collection: 'sessions' })
  .setStructure([...])

// Query from different databases
const users = await Mapper.get('users')        // From MySQL
const sessions = await Mapper.get('sessions')    // From MongoDB
```

## 🌍 Environment Configuration Guide

### **Node.js Environment Variables**

The Mapper automatically detects these environment variables:

```bash
# Basic database URL (auto-detects type)
DATABASE_URL=mysql://user:password@localhost:3306/myapp

# Or specific connection types
MYSQL_URL=mysql://user:password@localhost:3306/myapp
POSTGRES_URL=postgres://user:password@localhost:5432/myapp
MONGODB_URL=mongodb://localhost:27017/myapp
FIRESTORE_URL=firestore://project-id
```

### **Browser Environment**

For client-side applications, use the global configuration:

```html
<script>
  window.__MAPPER_CONFIG__ = {
    connection: {
      name: 'api',
      type: 'api',
      key: {
        endpoint: 'https://api.example.com',
        apiKey: 'your-api-key'
      }
    },
    schemas: [
      {
        name: 'users',
        connection: 'api',
        collection: 'users',
        structure: [
          { name: 'id', type: 'int' },
          { name: 'name', type: 'string' }
        ]
      }
    ]
  }
</script>
```

### **Configuration Priority Order**

1. **Manual Configuration**: `Mapper.connect()` calls
2. **Environment Variables**: `DATABASE_URL` and others
3. **Browser Global**: `window.__MAPPER_CONFIG__`
4. **Default Fallback**: In-memory API connection

### **Docker & Production Setup**

```dockerfile
# Dockerfile
ENV DATABASE_URL=mysql://user:password@db:3306/myapp
```

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - DATABASE_URL=mysql://user:password@db:3306/myapp
```

### **Configuration Validation**

```ts
import Mapper from '@neupgroup/mapper'

// Check current configuration
console.log('Connections:', Mapper.getConnections().list())
console.log('Schemas:', Mapper.getSchemaManager().list())

// Verify auto-configuration worked
const config = Mapper.getConnections().get('default')
if (!config) {
  console.log('No auto-configuration detected, using manual setup...')
  Mapper.connect('manual', 'mysql', { /* config */ })
}
```

## Advanced Usage (Original API)

For more control, you can still use the original granular API:

```ts
import { connection, schema } from '@neupgroup/mapper'
import type { DbAdapter, QueryOptions } from '@neupgroup/mapper'

// 1) Define connections
const conRegistry = connection()
conRegistry.create('mysql_prod', 'mysql').key({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 's3cr3t',
  database: 'appdb',
})

// 2) Attach an adapter for the connection
const adapter: DbAdapter = {
  async getDocuments(options: QueryOptions) { return [] },
  async addDocument(collectionName: string, data: Record<string, any>) { return 'new-id' },
  async updateDocument(collectionName: string, docId: string, data: Record<string, any>) { },
  async deleteDocument(collectionName: string, docId: string) { },
}
conRegistry.attachAdapter('mysql_prod', adapter)

// 3) Register schema and run CRUD
const sm = schema(conRegistry)
sm.create('User')
  .use({ connection: 'mysql_prod', collection: 'users' })
  .setStructure({
    id: 'string',
    email: 'string',
    name: 'string editable',
    createdAt: 'date',
    '?field': 'allow-undefined',
  })

const User = sm.use('User')
await User.add({ id: 'u_1', email: 'alice@example.com', name: 'Alice', createdAt: new Date() })
await User.where(['id', 'u_1']).to({ name: 'Alice Cooper' }).updateOne()
const one = await User.where(['id', 'u_1']).getOne()
await User.where(['id', 'u_1']).deleteOne()

## Connections DSL

You can define connections in a simple DSL and load them at runtime.

`connections.dsl` example:

```
connections = [
  mysql_prod = [
    type: mysql,
    host: 127.0.0.1,
    port: 3306,
    user: root,
    password: "s3cr3t",
    database: appdb,
  ],

  mongo_dev = [
    type: mongodb,
    uri: "mongodb://127.0.0.1:27017",
    database: devdb,
  ],
]
```

Load and normalize:

```ts
import { parseConnectionsDsl, toNormalizedConnections, connection, schema } from '@neupgroup/mapper'

const text = await fs.promises.readFile('connections.dsl', 'utf8')
const envMap = parseConnectionsDsl(text)
const conns = toNormalizedConnections(envMap)

const conRegistry = connection()
for (const c of conns) {
  conRegistry.register({ name: c.name, type: c.type, key: c.key })
}
const sm = schema(conRegistry)
```

Notes:
- `type` (or `dbType`) defaults to `api` if omitted.
- Values can be quoted or unquoted; `#` comments are ignored.

## Adapters

Adapters implement backend-specific operations. Shape:

```ts
export interface DbAdapter {
  get?(options: QueryOptions): Promise<any[]>
  getOne?(options: QueryOptions): Promise<any | null>
  getDocuments(options: QueryOptions): Promise<any[]>
  addDocument(collectionName: string, data: Record<string, any>): Promise<string>
  updateDocument(collectionName: string, docId: string, data: Record<string, any>): Promise<void>
  deleteDocument(collectionName: string, docId: string): Promise<void>
}
```

Attach to a connection with `conRegistry.attachAdapter('<name>', adapter)` before querying.

## Schemas & Structure

Define schemas with a descriptor object or explicit fields array:

```ts
sm.create('Product')
  .use({ connection: 'mysql_prod', collection: 'products' })
  .setStructure({
    id: 'string',
    title: 'string editable',
    price: 'number',
    createdAt: 'date',
    '?field': 'allow-undefined',
  })
```

Field tokens:
- `type`: one of `string`, `number`, `boolean`, `date`, `int`.
- `editable`: marks commonly modified fields.
- `'?field'`: enables accepting fields not listed in the schema.

## Query & CRUD

Build queries and run operations:

```ts
const Q = sm.use('Product')
await Q.add({ id: 'p_1', title: 'Widget', price: 9.99 })
const items = await Q.where('price', 10, '<').get()
const one = await Q.where(['id', 'p_1']).getOne()
await Q.where(['id', 'p_1']).to({ price: 7.99 }).updateOne()
await Q.where(['id', 'p_1']).deleteOne()
```

Methods:
- `where(field, value, operator?)`, `where([field, value])` and `whereComplex(raw)`.
- `get`, `getOne`, `add`, `delete`, `deleteOne`, `to(update).update`, `updateOne`.

## Documentation Helpers

For apps that want to render built-in documentation:

```ts
import { documentationMd, markdownToHtml, getDocumentationHtml } from '@neupgroup/mapper'

const html = getDocumentationHtml()
```

## API Reference

- `connection()` → create connections registry (see `src/index.ts:299`–`301`)
- `schema(conns?)` → create `SchemaManager` (see `src/index.ts:303`–`306`)
- `schemas` → singleton `SchemaManager` (see `src/index.ts:308`–`311`)
- `createOrm(adapter)` → wrapper around a `DbAdapter` (see `src/orm/index.ts:3`–`27`)
- `parseConnectionsDsl(text)`, `toNormalizedConnections(map)` (see `src/env.ts:31`–`75`, `87`–`95`)
- `documentationMd`, `markdownToHtml`, `getDocumentationHtml` (see `src/docs.ts:5`–`275`, `277`–`356`)
- Types: `DbAdapter`, `QueryOptions`, `EnvDslConnections`, `NormalizedConnection`.

## Build & Local Development

```bash
npm run build
```

Outputs are generated to `dist/` with type declarations.

## Error Handling & Troubleshooting

- Wrap operations in `try/catch` and handle nulls from `getOne()`.
- Verify credentials and network connectivity for your backend.
- Ensure schema field names and types match your storage engine.

---

Copyright © Neup Group

## 🎯 Quick Reference

### **One-Import Benefits**

✅ **Zero Configuration**: Works out of the box  
✅ **Auto-Detection**: Automatically configures from environment  
✅ **Universal**: Works in Node.js and browsers  
✅ **Type Safe**: Full TypeScript support  
✅ **Progressive**: Start simple, scale to complex  
✅ **Lightweight**: Minimal overhead, maximum performance  

### **Migration from Original API**

The new `Mapper` default export is fully compatible with the original API:

```ts
// Old way (still works)
import { connection, schema } from '@neupgroup/mapper'
const conns = connection()
const sm = schema(conns)

// New way (recommended)
import Mapper from '@neupgroup/mapper'
// Mapper is pre-configured and ready to use

// Access underlying managers if needed
const conns = Mapper.getConnections()
const sm = Mapper.getSchemaManager()
```

### **Best Practices**

1. **Start with defaults**: Let Mapper auto-configure itself
2. **Use environment variables**: Set `DATABASE_URL` for production
3. **Define schemas early**: Create schemas at app startup
4. **Use TypeScript**: Get full type safety and IntelliSense
5. **Handle errors**: Wrap operations in try/catch blocks

### **Common Patterns**

```ts
// Pattern 1: Quick CRUD
await Mapper.add('users', data)
const users = await Mapper.get('users')

// Pattern 2: Conditional updates
await Mapper.update('users', { status: 'pending' }, { status: 'active' })

// Pattern 3: Complex queries
const results = await Mapper.use('users')
  .where('age', 18, '>=')
  .where('country', 'US')
  .get()

// Pattern 4: Batch operations
const users = await Mapper.get('users')
for (const user of users) {
  await Mapper.update('users', { id: user.id }, { lastSeen: new Date() })
}
```

