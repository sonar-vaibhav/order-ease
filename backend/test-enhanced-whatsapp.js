/**
 * Enhanced WhatsApp Chatbot Test Script
 * Tests the new session management and natural conversation flow
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'https://order-ease-backend.onrender.com';
const TEST_PHONE = '917498780950';

console.log('🤖 Testing Enhanced WhatsApp Chatbot');
console.log(`📍 Backend URL: ${BASE_URL}`);
console.log(`📱 Test phone: ${TEST_PHONE}`);

// Simulate conversation flow
const conversationFlow = [
  { message: 'Hi', expected: 'welcome message' },
  { message: 'menu', expected: 'menu display' },
  { message: '2 pizza 1 coke', expected: 'order confirmation' },
  { message: 'yes', expected: 'ask for details' },
  { message: 'John Doe, 9876543210, Mumbai', expected: 'payment link' },
  { message: 'quit', expected: 'session reset' },
  { message: 'pizza and burger', expected: 'order parsing' },
  { message: 'track 20241031-001', expected: 'order tracking' }
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
      console.log(`✅ Message processed: ${description}`);
      return true;
    } else {
      console.log(`❌ Failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.data || error.message}`);
    return false;
  }
}

// Test session management
async function testSessionManagement() {
  console.log('\n🔄 Testing Session Management...');
  
  try {
    // Get active sessions
    const sessionsResponse = await axios.get(`${BASE_URL}/api/whatsapp/admin/sessions`);
    console.log(`✅ Active sessions: ${sessionsResponse.data.sessions?.length || 0}`);
    
    // Clear test session
    const clearResponse = await axios.post(`${BASE_URL}/api/whatsapp/admin/clear-session`, {
      phoneNumber: TEST_PHONE
    });
    console.log(`✅ Session cleared: ${clearResponse.data.success}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Session management error: ${error.response?.data || error.message}`);
    return false;
  }
}

// Test Gemini integration
async function testGeminiIntegration() {
  console.log('\n🤖 Testing Gemini Integration...');
  
  try {
    const testMessages = [
      'I want 2 pizza and 1 coke',
      'pizza 2 coke 1',
      'give me burger',
      'two pizzas please'
    ];

    for (const message of testMessages) {
      const response = await axios.post(`${BASE_URL}/api/whatsapp/test-order-parsing`, {
        message
      });
      
      console.log(`📝 "${message}" → ${response.data.parsedItems?.length || 0} items`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Gemini test error: ${error.response?.data || error.message}`);
    return false;
  }
}

// Run conversation flow test
async function testConversationFlow() {
  console.log('\n💬 Testing Conversation Flow...');
  
  // Clear session first
  await testSessionManagement();
  
  let successCount = 0;
  
  for (const step of conversationFlow) {
    const success = await testMessage(step.message, step.expected);
    if (success) successCount++;
    
    // Wait between messages to simulate real conversation
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Conversation Flow: ${successCount}/${conversationFlow.length} steps successful`);
  return successCount === conversationFlow.length;
}

// Test special commands
async function testSpecialCommands() {
  console.log('\n⚡ Testing Special Commands...');
  
  const commands = [
    { cmd: 'quit', desc: 'Session reset' },
    { cmd: 'menu', desc: 'Menu display' },
    { cmd: '20241031-001', desc: 'Order tracking' }
  ];
  
  let successCount = 0;
  
  for (const command of commands) {
    const success = await testMessage(command.cmd, command.desc);
    if (success) successCount++;
  }
  
  console.log(`📊 Special Commands: ${successCount}/${commands.length} successful`);
  return successCount === commands.length;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Enhanced WhatsApp Chatbot Tests...\n');
  
  const results = {
    sessionManagement: await testSessionManagement(),
    geminiIntegration: await testGeminiIntegration(),
    conversationFlow: await testConversationFlow(),
    specialCommands: await testSpecialCommands()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Enhanced chatbot is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation and try again.');
  }
  
  return results;
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'session':
      testSessionManagement();
      break;
    case 'gemini':
      testGeminiIntegration();
      break;
    case 'flow':
      testConversationFlow();
      break;
    case 'commands':
      testSpecialCommands();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

module.exports = {
  testSessionManagement,
  testGeminiIntegration,
  testConversationFlow,
  testSpecialCommands,
  runAllTests
};