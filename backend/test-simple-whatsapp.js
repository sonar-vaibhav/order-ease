/**
 * Simple WhatsApp Integration Test Script
 * Tests the basic webhook functionality
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'https://order-ease-backend.onrender.com';
const TEST_PHONE = '919876543210'; // Replace with your test number

console.log('🚀 Testing WhatsApp Integration');
console.log(`📍 Backend URL: ${BASE_URL}`);
console.log(`📱 Test phone: ${TEST_PHONE}`);

// Test webhook verification
async function testWebhookVerification() {
  console.log('\n🔍 Testing Webhook Verification...');
  try {
    const response = await axios.get(`${BASE_URL}/api/whatsapp/webhook`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'vebsdev23',
        'hub.challenge': 'test_challenge_123'
      }
    });
    
    if (response.data === 'test_challenge_123') {
      console.log('✅ Webhook verification successful');
      return true;
    } else {
      console.log('❌ Webhook verification failed - wrong response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook verification failed:', error.response?.data || error.message);
    return false;
  }
}

// Test health check
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/api/whatsapp/health`);
    console.log('✅ Health check successful:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.data || error.message);
    return false;
  }
}

// Test sending a message
async function testSendMessage() {
  console.log('\n📤 Testing Message Sending...');
  try {
    const response = await axios.post(`${BASE_URL}/api/whatsapp/send-test-message`, {
      to: TEST_PHONE,
      message: `🧪 Test message from OrderEase at ${new Date().toLocaleTimeString()}`
    });
    
    console.log('✅ Message sent successfully:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Message sending failed:', error.response?.data || error.message);
    return false;
  }
}

// Test webhook with sample message payload
async function testIncomingMessage() {
  console.log('\n📨 Testing Incoming Message Processing...');
  try {
    const samplePayload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              id: `test_msg_${Date.now()}`,
              text: {
                body: 'Hello OrderEase!'
              },
              type: 'text'
            }]
          }
        }]
      }]
    };

    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, samplePayload);
    
    if (response.status === 200) {
      console.log('✅ Incoming message processed successfully');
      return true;
    } else {
      console.log('❌ Incoming message processing failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Incoming message test failed:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting WhatsApp Integration Tests...\n');
  
  const results = {
    webhookVerification: await testWebhookVerification(),
    healthCheck: await testHealthCheck(),
    sendMessage: await testSendMessage(),
    incomingMessage: await testIncomingMessage()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your WhatsApp integration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above and your configuration.');
  }
  
  return results;
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'verify':
      testWebhookVerification();
      break;
    case 'health':
      testHealthCheck();
      break;
    case 'send':
      testSendMessage();
      break;
    case 'incoming':
      testIncomingMessage();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

// Export for use in other scripts
module.exports = {
  testWebhookVerification,
  testHealthCheck,
  testSendMessage,
  testIncomingMessage,
  runAllTests
};