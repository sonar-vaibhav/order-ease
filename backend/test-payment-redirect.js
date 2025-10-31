/**
 * Test Payment Success Redirects
 * Tests both WhatsApp and website payment success redirects
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'https://order-ease-backend.onrender.com';

console.log('💳 Testing Payment Success Redirects');
console.log(`📍 Backend URL: ${BASE_URL}`);

// Test WhatsApp payment success redirect
async function testWhatsAppPaymentRedirect() {
  console.log('\n📱 Testing WhatsApp Payment Success Redirect...');
  
  try {
    const testUrl = `${BASE_URL}/api/whatsapp/payment-success?razorpay_payment_id=pay_test123&razorpay_payment_link_id=plink_test123`;
    
    const response = await axios.get(testUrl, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });

    if (response.status === 302 || response.status === 301) {
      const redirectUrl = response.headers.location;
      console.log(`✅ WhatsApp payment redirects to: ${redirectUrl}`);
      
      if (redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
        console.log('✅ Correct redirect to track page');
        return true;
      } else {
        console.log('❌ Incorrect redirect URL');
        return false;
      }
    } else {
      console.log(`❌ Expected redirect, got status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response && (error.response.status === 301 || error.response.status === 302)) {
      const redirectUrl = error.response.headers.location;
      console.log(`✅ WhatsApp payment redirects to: ${redirectUrl}`);
      
      if (redirectUrl && redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
        console.log('✅ Correct redirect to track page');
        return true;
      }
    }
    
    console.log(`❌ WhatsApp payment redirect error: ${error.message}`);
    return false;
  }
}

// Test website payment success redirect
async function testWebsitePaymentRedirect() {
  console.log('\n🌐 Testing Website Payment Success Redirect...');
  
  try {
    const testUrl = `${BASE_URL}/api/payment-success?razorpay_payment_id=pay_test123&razorpay_order_id=order_test123`;
    
    const response = await axios.get(testUrl, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });

    if (response.status === 302 || response.status === 301) {
      const redirectUrl = response.headers.location;
      console.log(`✅ Website payment redirects to: ${redirectUrl}`);
      
      if (redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
        console.log('✅ Correct redirect to track page');
        return true;
      } else {
        console.log('❌ Incorrect redirect URL');
        return false;
      }
    } else {
      console.log(`❌ Expected redirect, got status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response && (error.response.status === 301 || error.response.status === 302)) {
      const redirectUrl = error.response.headers.location;
      console.log(`✅ Website payment redirects to: ${redirectUrl}`);
      
      if (redirectUrl && redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
        console.log('✅ Correct redirect to track page');
        return true;
      }
    }
    
    console.log(`❌ Website payment redirect error: ${error.message}`);
    return false;
  }
}

// Test error cases
async function testErrorRedirects() {
  console.log('\n❌ Testing Error Redirects...');
  
  const errorTests = [
    {
      name: 'WhatsApp - Missing payment info',
      url: `${BASE_URL}/api/whatsapp/payment-success`,
      expectedParam: 'error=payment_info_missing'
    },
    {
      name: 'Website - Missing payment info', 
      url: `${BASE_URL}/api/payment-success`,
      expectedParam: 'error=payment_info_missing'
    }
  ];

  let successCount = 0;

  for (const test of errorTests) {
    try {
      const response = await axios.get(test.url, {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });

      const redirectUrl = response.headers.location || '';
      if (redirectUrl.includes(test.expectedParam)) {
        console.log(`✅ ${test.name}: Correct error redirect`);
        successCount++;
      } else {
        console.log(`❌ ${test.name}: Incorrect error redirect`);
      }
    } catch (error) {
      if (error.response && error.response.headers.location) {
        const redirectUrl = error.response.headers.location;
        if (redirectUrl.includes(test.expectedParam)) {
          console.log(`✅ ${test.name}: Correct error redirect`);
          successCount++;
        } else {
          console.log(`❌ ${test.name}: Incorrect error redirect`);
        }
      } else {
        console.log(`❌ ${test.name}: No redirect found`);
      }
    }
  }

  return successCount === errorTests.length;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Payment Redirect Tests...\n');
  
  const results = {
    whatsappRedirect: await testWhatsAppPaymentRedirect(),
    websiteRedirect: await testWebsitePaymentRedirect(),
    errorRedirects: await testErrorRedirects()
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
    console.log('🎉 All payment redirects working correctly!');
    console.log('\n📱 WhatsApp users will be redirected to: https://order-ease-i1t7.onrender.com/track');
    console.log('🌐 Website users will be redirected to: https://order-ease-i1t7.onrender.com/track');
  } else {
    console.log('⚠️ Some redirects failed. Check the implementation.');
  }
  
  return results;
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'whatsapp':
      testWhatsAppPaymentRedirect();
      break;
    case 'website':
      testWebsitePaymentRedirect();
      break;
    case 'errors':
      testErrorRedirects();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

module.exports = {
  testWhatsAppPaymentRedirect,
  testWebsitePaymentRedirect,
  testErrorRedirects,
  runAllTests
};