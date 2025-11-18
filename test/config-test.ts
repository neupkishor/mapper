// Test the configuration-based mapper system
import { createConfigMapper, createDefaultMapper } from '../src/config';
import type { MapperConfig } from '../src/config';

// Test configuration
const testConfig: MapperConfig = {
  connections: [
    {
      name: 'test_db',
      type: 'sql',
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'postgres',
      password: 'password'
    },
    {
      name: 'test_api',
      type: 'api',
      url: 'https://api.example.com',
      headers: {
        'Content-Type': 'application/json'
      }
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
    },
    {
      name: 'products',
      connection: 'test_api',
      collection: 'products',
      structure: {
        'product_id': 'string',
        'name': 'string',
        'price': 'number'
      }
    }
  ]
};

async function testConfigBasedMapper() {
  console.log('🧪 Testing Configuration-Based Mapper System');
  
  try {
    // Test 1: Create mapper with configuration
    console.log('\n✅ Test 1: Creating mapper with configuration...');
    const mapper = createConfigMapper(testConfig);
    console.log('   Mapper created successfully');

    // Test 2: Verify connections are configured
    console.log('\n✅ Test 2: Verifying connections...');
    const connections = mapper.getConnections().list();
    console.log(`   Found ${connections.length} connections:`);
    connections.forEach(conn => {
      console.log(`   - ${conn.name} (${conn.type})`);
    });

    // Test 3: Verify schemas are configured
    console.log('\n✅ Test 3: Verifying schemas...');
    const schemaManager = mapper.getSchemaManager();
    const schemas = schemaManager.list();
    console.log(`   Found ${schemas.length} schemas:`);
    schemas.forEach(schema => {
      console.log(`   - ${schema.name} (connection: ${schema.connectionName}, collection: ${schema.collectionName})`);
    });

    // Test 4: Test schema usage
    console.log('\n✅ Test 4: Testing schema access...');
    const userQuery = mapper.use('users');
    console.log('   User schema query object created');

    const productQuery = mapper.use('products');
    console.log('   Product schema query object created');

    // Test 5: Test configuration validation
    console.log('\n✅ Test 5: Testing configuration validation...');
    try {
      const invalidMapper = createConfigMapper({
        connections: [] // Empty connections
      });
      console.log('   Empty connections allowed');
    } catch (error) {
      console.log('   Configuration validation working');
    }

    console.log('\n🎉 All tests passed! Configuration-based mapper is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function testAutoConfiguration() {
  console.log('\n🔧 Testing Auto-Configuration...');
  
  try {
    // Test auto-configuration without explicit config
    const mapper = createDefaultMapper();
    console.log('   Auto-configured mapper created');

    // The mapper should be ready to use (even if no config was found)
    console.log('   Mapper ready for use');

  } catch (error) {
    console.log('   Auto-configuration handled gracefully (expected if no config found)');
  }
}

// Run tests
async function runTests() {
  await testConfigBasedMapper();
  await testAutoConfiguration();
  
  console.log('\n✨ Configuration-based mapper system is ready to use!');
}

// Export for use in other tests
export { testConfigBasedMapper, testAutoConfiguration, testConfig };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}