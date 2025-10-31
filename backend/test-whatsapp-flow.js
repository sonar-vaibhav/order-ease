/**
 * WhatsApp Integration Test Script
 * This script simulates the WhatsApp message flow for testing purposes
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Change to your backend URL
const TEST_PHONE = '919876543210'; // Test phone number

// Test message payloads
const createWebhookPayload = (from, messageBody, messageId = null) => ({
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: from,
          id: messageId || `msg_${Date.now()}`,
          text: {
            body: messageBody
          },
          type: 'text'
        }]
      }
    }]
  }]
});

// Test functions
async function testWebhookVerification() {
  console.log('\n🔍 Testing Webhook Verification...');
  try {
    const response = await axios.get(`${BASE_URL}/api/whatsapp/webhook`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token',
        'hub.challenge': 'test_challenge_123'
      }
    });
    console.log('✅ Webhook verification successful:', response.data);
  } catch (error) {
    console.log('❌ Webhook verification failed:', error.response?.data || error.message);
  }
}

async function testWelcomeMessage() {
  console.log('\n👋 Testing Welcome Message...');
  try {
    const payload = createWebhookPayload(TEST_PHONE, 'Hi');
    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, payload);
    console.log('✅ Welcome message test successful');
  } catch (error) {
    console.log('❌ Welcome message test failed:', error.response?.data || error.message);
  }
}

async function testMenuRequest() {
  console.log('\n🍽️ Testing Menu Request...');
  try {
    const payload = createWebhookPayload(TEST_PHONE, 'menu');
    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, payload);
    console.log('✅ Menu request test successful');
  } catch (error) {
    console.log('❌ Menu request test failed:', error.response?.data || error.message);
  }
}

async function testOrderRequest() {
  console.log('\n🛒 Testing Order Request...');
  try {
    const payload = createWebhookPayload(TEST_PHONE, 'I want 2 pizza and 1 coke');
    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, payload);
    console.log('✅ Order request test successful');
  } catch (error) {
    console.log('❌ Order request test failed:', error.response?.data || error.message);
  }
}

async function testCustomerDetails() {
  console.log('\n📝 Testing Customer Details...');
  try {
    // Wait a bit to ensure order is created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const payload = createWebhookPayload(TEST_PHONE, 'John Doe, 9876543210, 123 Main Street');
    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, payload);
    console.log('✅ Customer details test successful');
  } catch (error) {
    console.log('❌ Customer details test failed:', error.response?.data || error.message);
  }
}

async function testOrderTracking() {
  console.log('\n🔍 Testing Order Tracking...');
  try {
    const payload = createWebhookPayload(TEST_PHONE, 'track order');
    const response = await axios.post(`${BASE_URL}/api/whatsapp/webhook`, payload);
    console.log('✅ Order tracking test successful');
  } catch (error) {
    console.log('❌ Order tracking test failed:', error.response?.data || error.message);
  }
}

async function testDirectMessage() {
  console.log('\n📱 Testing Direct Message Send...');
  try {
    const response = await axios.post(`${BASE_URL}/api/whatsapp/send-test-message`, {
      to: TEST_PHONE,
      message: 'This is a test message from the OrderEase system!'
    });
    console.log('✅ Direct message test successful:', response.data);
  } catch (error) {
    console.log('❌ Direct message test failed:', error.response?.data || error.message);
  }
}

async function testGetOrders() {
  console.log('\n📋 Testing Get Orders...');
  try {
    const response = await axios.get(`${BASE_URL}/api/whatsapp/orders/${TEST_PHONE}`);
    console.log('✅ Get orders test successful:', response.data);
  } catch (error) {
    console.log('❌ Get orders test failed:', error.response?.data || error.message);
  }
}

async function testGetStats() {
  console.log('\n📊 Testing Get Statistics...');
  try {
    const response = await axios.get(`${BASE_URL}/api/whatsapp/stats`);
    console.log('✅ Get statistics test successful:', response.data);
  } catch (error) {
    console.log('❌ Get statistics test failed:', error.response?.data || error.message);
  }
}

// Simulate Razorpay webhook
async function testRazorpayWebhook() {
  console.log('\n💳 Testing Razorpay Webhook...');
  try {
    const webhookPayload = {
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: {
            id: 'plink_test123',
            notes: {
              whatsapp_order_id: 'test_order_id'
            }
          }
        },
        payment: {
          entity: {
            id: 'pay_test123',
            amount: 50000, // ₹500 in paise
            status: 'captured'
          }
        }
      }
    };

    const response = await axios.post(`${BASE_URL}/api/whatsapp/razorpay-webhook`, webhookPayload);
    console.log('✅ Razorpay webhook test successful');
  } catch (error) {
    console.log('❌ Razorpay webhook test failed:', error.response?.data || error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting WhatsApp Integration Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📱 Test phone number: ${TEST_PHONE}`);
  
  try {
    // Basic tests
    await testWebhookVerification();
    await testDirectMessage();
    
    // Message flow tests
    await testWelcomeMessage();
    await testMenuRequest();
    await testOrderRequest();
    await testCustomerDetails();
    await testOrderTracking();
    
    // Data retrieval tests
    await testGetOrders();
    await testGetStats();
    
    // Payment webhook test
    await testRazorpayWebhook();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Note: Some tests may fail if WhatsApp credentials are not configured.');
    console.log('Check your .env file and ensure all required variables are set.');
    
  } catch (error) {
    console.log('\n💥 Test runner error:', error.message);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'webhook':
      testWebhookVerification();
      break;
    case 'message':
      testDirectMessage();
      break;
    case 'welcome':
      testWelcomeMessage();
      break;
    case 'menu':
      testMenuRequest();
      break;
    case 'order':
      testOrderRequest();
      break;
    case 'details':
      testCustomerDetails();
      break;
    case 'track':
      testOrderTracking();
      break;
    case 'stats':
      testGetStats();
      break;
    case 'payment':
      testRazorpayWebhook();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

module.exports = {
  testWebhookVerification,
  testDirectMessage,
  testWelcomeMessage,
  testMenuRequest,
  testOrderRequest,
  testCustomerDetails,
  testOrderTracking,
  testGetOrders,
  testGetStats,
  testRazorpayWebhook,
  runAllTests
};