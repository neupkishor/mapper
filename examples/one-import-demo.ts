// Test file to demonstrate the one-import pattern
import Mapper from '@neupgroup/mapper';

// Example 1: Basic usage with auto-configuration
async function basicExample() {
  console.log('=== Basic Example ===');
  
  // The Mapper is already configured and ready to use
  console.log('Available connections:', Mapper.getConnections().list());
  console.log('Available schemas:', Mapper.getSchemaManager().list());
}

// Example 2: Quick setup with a schema
async function schemaExample() {
  console.log('\n=== Schema Example ===');
  
  // Create a simple schema
  Mapper.schema('users')
    .use({ connection: 'default', collection: 'users' })
    .setStructure([
      { name: 'id', type: 'int', autoIncrement: true },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string' }
    ]);
  
  console.log('Schema created successfully');
}

// Example 3: Using environment configuration
async function envConfigExample() {
  console.log('\n=== Environment Config Example ===');
  
  // If DATABASE_URL is set, Mapper will auto-detect and configure
  // Example: DATABASE_URL=mysql://user:pass@localhost:3306/mydb
  
  console.log('Auto-configuration complete');
}

// Example 4: Manual configuration
async function manualConfigExample() {
  console.log('\n=== Manual Config Example ===');
  
  // Manually configure a connection
  Mapper.connect('mydb', 'mysql', {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'myapp'
  });
  
  console.log('Manual configuration complete');
}

// Example 5: Quick CRUD operations
async function crudExample() {
  console.log('\n=== CRUD Example ===');
  
  try {
    // Add a user
    await Mapper.add('users', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    // Get all users
    const users = await Mapper.get('users');
    console.log('Users:', users);
    
    // Get specific user
    const user = await Mapper.getOne('users', { email: 'john@example.com' });
    console.log('Found user:', user);
    
    // Update user
    await Mapper.update('users', { email: 'john@example.com' }, { name: 'John Smith' });
    
    // Delete user
    await Mapper.delete('users', { email: 'john@example.com' });
    
  } catch (error) {
    console.log('Note: CRUD operations require proper database adapter setup');
  }
}

// Run examples
async function runExamples() {
  await basicExample();
  await schemaExample();
  await envConfigExample();
  await manualConfigExample();
  await crudExample();
}

// Export for use in other modules
export { Mapper, runExamples };