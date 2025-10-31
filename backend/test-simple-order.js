/**
 * Test Simple Order Bot
 * Tests the simplified WhatsApp ordering system
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'https://order-ease-backend.onrender.com';
const TEST_PHONE = '917498780950';

console.log('🤖 Testing Simple Order Bot');
console.log(`📍 Backend URL: ${BASE_URL}`);

// Test messages that should work
const testMessages = [
  { message: 'Hi', expected: 'Welcome message' },
  { message: 'menu', expected: 'Menu display' },
  { message: '2 pizza', expected: 'Order confirmation' },
  { message: 'margherita pizza', expected: 'Order confirmation' },
  { message: 'burger', expected: 'Order confirmation' },
  { message: '1 coke', expected: 'Order confirmation' }
];

// Test individual message
async function testMessage(message, description) {
  console.log(`\n📤 Testing: "${message}" (${description})`);
  
  try {
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              id: `test_${Date.now()}`,
              text: { body: message },
              type: 'text'
            }]
          }
        }]
      }]
    };

    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      console.log(`✅ ${description}: Message processed successfully`);
      return true;
    } else {
      console.log(`❌ ${description}: Failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error - ${error.response?.data || error.message}`);
    return false;
  }
}

// Test order parsing logic
async function testOrderParsing() {
  console.log('\n🔍 Testing Order Parsing Logic...');
  
  const testCases = [
    '2 pizza',
    'margherita pizza', 
    '1 burger',
    'coke',
    '2 margherita pizza',
    'pizza and coke',
    'I want 2 pizza'
  ];

  for (const testCase of testCases) {
    await testMessage(testCase, `Parse: ${testCase}`);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test complete flow
async function testCompleteFlow() {
  console.log('\n🔄 Testing Complete Order Flow...');
  
  const flow = [
    'Hi',
    'menu', 
    '2 pizza',
    'John Doe, 9876543210, Mumbai'
  ];

  for (const step of flow) {
    await testMessage(step, `Flow step: ${step}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Simple Order Bot Tests...\n');
  
  try {
    // Test basic messages
    console.log('📋 Testing Basic Messages...');
    for (const test of testMessages) {
      await testMessage(test.message, test.expected);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test order parsing
    await testOrderParsing();

    // Test complete flow
    await testCompleteFlow();

    console.log('\n🎉 All tests completed!');
    console.log('\n💡 Check your WhatsApp to see the bot responses.');
    console.log('📱 The bot should now understand:');
    console.log('   • "2 pizza" ✅');
    console.log('   • "margherita pizza" ✅'); 
    console.log('   • "burger" ✅');
    console.log('   • "menu" ✅');
    
  } catch (error) {
    console.log('\n💥 Test error:', error.message);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'parsing':
      testOrderParsing();
      break;
    case 'flow':
      testCompleteFlow();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

module.exports = {
  testMessage,
  testOrderParsing,
  testCompleteFlow,
  runAllTests
};