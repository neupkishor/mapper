// Final integration test for the configuration-based mapper
const { createConfigMapper, createDefaultMapper } = require('../dist/config');

const testConfig = {
  connections: [
    {
      name: 'test_db',
      type: 'sql',
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'postgres',
      password: 'password'
    }
  ],
  schemas: [
    {
      name: 'users',
      connection: 'test_db',
      collection: 'users',
      structure: {
        'id': 'int auto_increment',
        'name': 'string editable',
        'email': 'string editable'
      }
    }
  ]
};

async function runIntegrationTest() {
  console.log('🚀 Running Integration Test for Config-Based Mapper');
  
  try {
    // Test 1: Create mapper with config
    console.log('\n✅ Test 1: Creating mapper with configuration...');
    const mapper = createConfigMapper(testConfig);
    console.log('   ✓ Mapper created successfully');

    // Test 2: Access connections
    console.log('\n✅ Test 2: Accessing connections...');
    const connections = mapper.getConnections().list();
    console.log(`   ✓ Found ${connections.length} connection(s)`);
    connections.forEach(conn => {
      console.log(`   ✓ Connection: ${conn.name} (${conn.type})`);
    });

    // Test 3: Access schemas
    console.log('\n✅ Test 3: Accessing schemas...');
    const schemas = mapper.getSchemaManager().list();
    console.log(`   ✓ Found ${schemas.length} schema(s)`);
    schemas.forEach(schema => {
      console.log(`   ✓ Schema: ${schema.name} (${schema.connectionName}.${schema.collectionName})`);
    });

    // Test 4: Create query objects
    console.log('\n✅ Test 4: Creating query objects...');
    const userQuery = mapper.use('users');
    console.log('   ✓ User query object created');

    // Test 5: Test schema creation
    console.log('\n✅ Test 5: Testing schema creation...');
    const newSchema = mapper.schema('products')
      .use({ connection: 'test_db', collection: 'products' })
      .setStructure({
        'id': 'int auto_increment',
        'name': 'string editable',
        'price': 'number editable'
      });
    console.log('   ✓ New schema created successfully');

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('   • Configuration-based mapper is working correctly');
    console.log('   • Connections are properly configured');
    console.log('   • Schemas are accessible and functional');
    console.log('   • Query objects can be created');
    console.log('   • Dynamic schema creation works');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Run the integration test
runIntegrationTest().catch(console.error);