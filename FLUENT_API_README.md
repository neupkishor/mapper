# Fluent/Static Mapper API

This document describes the new PHP-style fluent/static API for the @neupgroup/mapper system, providing chainable method calls similar to Laravel's query builder or other PHP frameworks.

## Overview

The fluent API allows you to create connections, define schemas, and execute queries using method chaining, making your code more readable and concise. Think of it as a Laravel-style query builder for JavaScript/TypeScript.

## Quick Start

### Basic Usage

```typescript
import { Mapper } from '@neupgroup/mapper';

// Create connection, define schema, and query - all in one chain!
const users = await Mapper.makeConnection('users_db', 'sql', {
  host: 'localhost',
  port: 5432,
  database: 'users',
  user: 'postgres',
  password: 'password'
})
  .schema('users')
  .collection('users')
  .structure({
    'id': 'int auto_increment',
    'name': 'string editable',
    'email': 'string editable'
  })
  .query('users')
  .where('status', 'active')
  .get();
```

### Temporary Connections

Perfect for one-off API calls or temporary database connections:

```typescript
const products = await Mapper.makeTempConnection('api', {
  url: 'https://api.example.com/products',
  headers: {
    'Authorization': 'Bearer token123'
  }
})
  .query('products')
  .where('category', 'electronics')
  .where('price', 100, '>')
  .get();
```

### Using Existing Connections

```typescript
// Use a previously created connection
const activeUsers = await Mapper.useConnection('users_db')
  .query('users')
  .where('status', 'active')
  .where('last_login', '2024-01-01', '>=')
  .get();
```

## API Reference

### Static Methods

#### `Mapper.makeConnection(name, type, config)`
Creates a persistent connection that can be reused throughout your application.

```typescript
Mapper.makeConnection('my_db', 'sql', {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
})
  .schema('users')
  .collection('users')
  .structure({
    'id': 'int auto_increment',
    'name': 'string editable',
    'email': 'string editable'
  });
```

#### `Mapper.makeTempConnection(type, config)`
Creates a temporary connection that's automatically cleaned up. Perfect for APIs or one-time database operations.

```typescript
const data = await Mapper.makeTempConnection('api', {
  url: 'https://api.example.com/data',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000
})
  .query('endpoint')
  .where('filter', 'value')
  .get();
```

#### `Mapper.useConnection(name)`
Uses a previously created connection by name.

```typescript
const results = await Mapper.useConnection('my_db')
  .query('users')
  .where('active', true)
  .get();
```

#### `Mapper.query(schemaName)`
Direct query on the default/global mapper instance.

```typescript
const users = await Mapper.query('users')
  .where('status', 'active')
  .get();
```

### Chainable Methods

#### Schema Definition Chain

```typescript
Mapper.makeConnection('db', 'sql', config)
  .schema('users')           // Define schema name
  .collection('users')       // Define collection/table name
  .structure({               // Define field structure
    'id': 'int auto_increment',
    'name': 'string editable',
    'email': 'string editable',
    'created_at': 'date'
  });
```

#### Query Chain

```typescript
Mapper.useConnection('db')
  .query('users')
  .where('age', 18, '>=')     // WHERE age >= 18
  .where('status', 'active')   // AND status = 'active'
  .whereComplex("name LIKE '%john%'") // Raw SQL/API condition
  .get();                      // Execute query
```

### Query Operations

#### `where(field, value, operator?)`
Add a WHERE condition to your query.

```typescript
// Simple equality
Mapper.query('users').where('status', 'active').get();

// With operator
Mapper.query('users').where('age', 18, '>=').get();
Mapper.query('products').where('price', 100, '<').get();
Mapper.query('orders').where('created_at', '2024-01-01', '>=').get();
```

#### `whereComplex(raw)`
Add a raw/complex condition.

```typescript
Mapper.query('users')
  .whereComplex("name LIKE '%john%' AND created_at > '2024-01-01'")
  .get();
```

#### `to(updateData)`
Set data for UPDATE operations.

```typescript
Mapper.query('users')
  .where('id', 123)
  .to({ status: 'inactive', updated_at: new Date() })
  .update();
```

### Execution Methods

#### `get()` - Get multiple records
```typescript
const users = await Mapper.query('users').where('active', true).get();
```

#### `getOne()` - Get single record
```typescript
const user = await Mapper.query('users').where('email', 'john@example.com').getOne();
```

#### `add(data)` - Insert new record
```typescript
const newUser = await Mapper.query('users').add({
  name: 'John Doe',
  email: 'john@example.com',
  created_at: new Date()
});
```

#### `update()` - Update multiple records
```typescript
await Mapper.query('users')
  .where('last_login', '2023-01-01', '<')
  .to({ status: 'inactive' })
  .update();
```

#### `updateOne()` - Update single record
```typescript
await Mapper.query('users')
  .where('id', 123)
  .to({ name: 'Jane Doe' })
  .updateOne();
```

#### `delete()` - Delete multiple records
```typescript
await Mapper.query('users')
  .where('status', 'inactive')
  .where('created_at', '2023-01-01', '<')
  .delete();
```

#### `deleteOne()` - Delete single record
```typescript
await Mapper.query('users')
  .where('id', 123)
  .deleteOne();
```

## Real-World Examples

### User Registration Workflow

```typescript
async function registerUser(userData: any) {
  // Create user in database
  const user = await Mapper.makeConnection('users_db', 'sql', {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password'
  })
    .schema('users')
    .collection('users')
    .structure({
      'id': 'int auto_increment',
      'name': 'string editable',
      'email': 'string editable',
      'password': 'string',
      'created_at': 'date'
    })
    .query('users')
    .add({
      name: userData.name,
      email: userData.email,
      password: hashPassword(userData.password),
      created_at: new Date()
    });

  // Send welcome email via API
  await Mapper.makeTempConnection('api', {
    url: 'https://email-api.example.com/send',
    headers: {
      'Authorization': 'Bearer email_token',
      'Content-Type': 'application/json'
    }
  })
    .query('emails')
    .add({
      to: userData.email,
      subject: 'Welcome to our platform!',
      template: 'welcome_email',
      user_id: user.id
    });

  return user;
}
```

### E-commerce Order Processing

```typescript
async function processOrder(orderData: any) {
  // Create order in database
  const order = await Mapper.useConnection('orders_db')
    .query('orders')
    .add({
      customer_id: orderData.customer_id,
      total: orderData.total,
      status: 'pending',
      created_at: new Date()
    });

  // Check inventory via API
  const inventoryCheck = await Mapper.makeTempConnection('api', {
    url: 'https://inventory.example.com/check',
    headers: { 'Authorization': 'Bearer inventory_token' }
  })
    .query('inventory')
    .where('product_id', orderData.product_id)
    .where('quantity', orderData.quantity, '>=')
    .getOne();

  if (!inventoryCheck) {
    throw new Error('Insufficient inventory');
  }

  // Process payment
  const payment = await Mapper.makeTempConnection('api', {
    url: 'https://payment.example.com/charge',
    timeout: 10000
  })
    .query('payments')
    .add({
      order_id: order.id,
      amount: orderData.total,
      payment_method: orderData.payment_method
    });

  // Update order status
  await Mapper.useConnection('orders_db')
    .query('orders')
    .where('id', order.id)
    .to({ status: 'paid' })
    .updateOne();

  return { order, payment };
}
```

### Data Analytics Query

```typescript
async function getAnalyticsData(dateRange: { start: string; end: string }) {
  return await Mapper.makeTempConnection('api', {
    url: 'https://analytics.example.com/data',
    headers: {
      'Authorization': 'Bearer analytics_token',
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 second timeout for large data
  })
    .query('metrics')
    .where('date', dateRange.start, '>=')
    .where('date', dateRange.end, '<=')
    .whereComplex("metric_type IN ('sales', 'traffic', 'conversion')")
    .where('status', 'validated')
    .get();
}
```

## Comparison with Traditional Approach

### Traditional (Verbose)
```typescript
import { createMapper } from '@neupgroup/mapper';

const mapper = createMapper();

// Create connection
mapper.connect('users_db', 'sql', {
  host: 'localhost',
  port: 5432,
  database: 'users',
  user: 'postgres',
  password: 'password'
});

// Define schema
mapper.schema('users')
  .use({ connection: 'users_db', collection: 'users' })
  .setStructure({
    'id': 'int auto_increment',
    'name': 'string editable',
    'email': 'string editable'
  });

// Query
const users = await mapper.get('users', { status: 'active' });
```

### Fluent (Concise)
```typescript
import { Mapper } from '@neupgroup/mapper';

const users = await Mapper.makeConnection('users_db', 'sql', {
  host: 'localhost',
  port: 5432,
  database: 'users',
  user: 'postgres',
  password: 'password'
})
  .schema('users')
  .collection('users')
  .structure({
    'id': 'int auto_increment',
    'name': 'string editable',
    'email': 'string editable'
  })
  .query('users')
  .where('status', 'active')
  .get();
```

## Benefits

✅ **Less Code** - 50% reduction in lines of code  
✅ **More Readable** - Natural language-like syntax  
✅ **Chainable** - Single expression for complex operations  
✅ **PHP-Style** - Familiar to PHP/Laravel developers  
✅ **Temporary Connections** - No cleanup needed  
✅ **Type-Safe** - Full TypeScript support  
✅ **Backward Compatible** - Traditional API still works  

## Migration Guide

The fluent API is completely backward compatible. You can:

1. **Continue using the traditional API** - No changes needed
2. **Gradually adopt the fluent API** - Mix and match as needed
3. **Use both APIs together** - They're fully compatible

```typescript
// You can use both APIs in the same application
import { createMapper, Mapper } from '@neupgroup/mapper';

// Traditional API (existing code)
const traditionalMapper = createMapper();
const users1 = await traditionalMapper.get('users');

// Fluent API (new code)
const users2 = await Mapper.query('users').get();
```

## Error Handling

The fluent API maintains the same error handling patterns as the traditional API:

```typescript
try {
  const users = await Mapper.query('users')
    .where('status', 'active')
    .get();
} catch (error) {
  console.error('Query failed:', error);
}
```

## Performance

The fluent API adds minimal overhead - it's essentially a thin wrapper around the existing mapper functionality. All the performance characteristics remain the same.

## Examples

See the `/examples` directory for complete working examples:
- `fluent-api-examples.ts` - Comprehensive fluent API examples
- `fluent-vs-traditional.ts` - Side-by-side comparison
- `config-usage-example.ts` - Configuration-based approach (still available)