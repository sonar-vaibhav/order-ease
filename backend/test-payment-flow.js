/**
 * Test Payment Flow for Simple WhatsApp Bot
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'https://order-ease-backend.onrender.com';
const TEST_PHONE = '917498780950';

console.log('💳 Testing Payment Flow');
console.log(`📍 Backend URL: ${BASE_URL}`);

// Test complete order flow with payment
async function testCompleteOrderFlow() {
  console.log('\n🔄 Testing Complete Order Flow with Payment...');
  
  const steps = [
    {
      message: 'Hi',
      description: 'Welcome message',
      delay: 1000
    },
    {
      message: '2 margherita pizza',
      description: 'Place order',
      delay: 2000
    },
    {
      message: 'John Doe, 9876543210, Mumbai',
      description: 'Provide customer details (should get payment link)',
      delay: 3000
    }
  ];

  for (const step of steps) {
    console.log(`\n📤 Step: "${step.message}" (${step.description})`);
    
    try {
      const payload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: TEST_PHONE,
                id: `test_${Date.now()}`,
                text: { body: step.message },
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
        console.log(`✅ ${step.description}: Success`);
        
        if (step.message.includes('9876543210')) {
          console.log('💳 Check WhatsApp for payment link!');
        }
      } else {
        console.log(`❌ ${step.description}: Failed`);
      }
    } catch (error) {
      console.log(`❌ ${step.description}: Error - ${error.message}`);
    }

    // Wait before next step
    await new Promise(resolve => setTimeout(resolve, step.delay));
  }
}

// Test payment success callback
async function testPaymentCallback() {
  console.log('\n💳 Testing Payment Success Callback...');
  
  try {
    const testUrl = `${BASE_URL}/api/whatsapp/payment-success?razorpay_payment_id=pay_test123&razorpay_payment_link_id=plink_test123`;
    
    const response = await axios.get(testUrl, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });

    if (response.status === 302 || response.status === 301) {
      const redirectUrl = response.headers.location;
      console.log(`✅ Payment callback redirects to: ${redirectUrl}`);
      
      if (redirectUrl && redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
        console.log('✅ Correct redirect to track page');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    if (error.response && (error.response.status === 301 || error.response.status === 302)) {
      const redirectUrl = error.response.headers.location;
      console.log(`✅ Payment callback redirects to: ${redirectUrl}`);
      return redirectUrl && redirectUrl.includes('order-ease-i1t7.onrender.com/track');
    }
    
    console.log(`❌ Payment callback error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Payment Flow Tests...\n');
  
  try {
    // Test complete order flow
    await testCompleteOrderFlow();
    
    // Test payment callback
    const callbackWorks = await testPaymentCallback();
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`✅ Order Flow: Completed`);
    console.log(`${callbackWorks ? '✅' : '❌'} Payment Callback: ${callbackWorks ? 'Working' : 'Failed'}`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Check your WhatsApp for the payment link');
    console.log('2. Click the payment link to test the full flow');
    console.log('3. After payment, you should be redirected to track page');
    console.log('4. You should receive Order ID confirmation on WhatsApp');
    
  } catch (error) {
    console.log('\n💥 Test error:', error.message);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'flow':
      testCompleteOrderFlow();
      break;
    case 'callback':
      testPaymentCallback();
      break;
    case 'all':
    default:
      runTests();
      break;
  }
}

module.exports = {
  testCompleteOrderFlow,
  testPaymentCallback,
  runTests
};