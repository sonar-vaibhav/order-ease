/**
 * Test Order Controller Functions
 * Tests the fixed order controller functionality
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'https://order-ease-backend.onrender.com';

console.log('🧪 Testing Order Controller Functions');
console.log(`📍 Backend URL: ${BASE_URL}`);

// Test creating a Razorpay order
async function testCreateRazorpayOrder() {
  console.log('\n💳 Testing Create Razorpay Order...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/create-razorpay-order`, {
      amount: 500,
      currency: 'INR',
      orderId: '20241031-001'
    });

    if (response.data && response.data.id) {
      console.log('✅ Razorpay order created successfully');
      console.log(`📋 Order ID: ${response.data.id}`);
      console.log(`💰 Amount: ₹${response.data.amount / 100}`);
      return true;
    } else {
      console.log('❌ Invalid response from Razorpay order creation');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error creating Razorpay order: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test getting all orders
async function testGetAllOrders() {
  console.log('\n📋 Testing Get All Orders...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/orders`);

    if (Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} orders`);
      
      if (response.data.length > 0) {
        const firstOrder = response.data[0];
        console.log(`📋 First order ID: ${firstOrder.displayOrderId}`);
        console.log(`📅 Created: ${new Date(firstOrder.createdAt).toLocaleString()}`);
        
        // Check if orders are sorted by newest first
        if (response.data.length > 1) {
          const firstOrderTime = new Date(response.data[0].createdAt);
          const secondOrderTime = new Date(response.data[1].createdAt);
          
          if (firstOrderTime >= secondOrderTime) {
            console.log('✅ Orders are sorted correctly (newest first)');
          } else {
            console.log('❌ Orders are not sorted correctly');
          }
        }
      }
      
      return true;
    } else {
      console.log('❌ Invalid response format for orders');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error getting orders: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test payment success redirect (without actual payment)
async function testPaymentSuccessRedirect() {
  console.log('\n🔄 Testing Payment Success Redirect...');
  
  try {
    const testUrl = `${BASE_URL}/api/payment-success?razorpay_payment_id=pay_test123&razorpay_order_id=order_test123`;
    
    const response = await axios.get(testUrl, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });

    if (response.status === 302 || response.status === 301) {
      const redirectUrl = response.headers.location;
      console.log(`✅ Payment success redirects to: ${redirectUrl}`);
      
      if (redirectUrl && redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
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
      console.log(`✅ Payment success redirects to: ${redirectUrl}`);
      
      if (redirectUrl && redirectUrl.includes('order-ease-i1t7.onrender.com/track')) {
        console.log('✅ Correct redirect to track page');
        return true;
      }
    }
    
    console.log(`❌ Payment success redirect error: ${error.message}`);
    return false;
  }
}

// Test creating a new order
async function testCreateOrder() {
  console.log('\n📝 Testing Create Order...');
  
  try {
    const orderData = {
      items: [
        { name: 'Test Pizza', quantity: 2, price: 250 },
        { name: 'Test Coke', quantity: 1, price: 50 }
      ],
      customer: {
        name: 'Test Customer',
        phone: '9876543210',
        address: 'Test Address'
      },
      source: 'website'
    };

    const response = await axios.post(`${BASE_URL}/api/orders`, orderData);

    if (response.data && response.data.displayOrderId) {
      console.log('✅ Order created successfully');
      console.log(`📋 Order ID: ${response.data.displayOrderId}`);
      console.log(`👤 Customer: ${response.data.customer.name}`);
      console.log(`💰 Total: ₹${response.data.totalAmount || 'calculated by virtual'}`);
      return true;
    } else {
      console.log('❌ Invalid response from order creation');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error creating order: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Order Controller Tests...\n');
  
  const results = {
    createOrder: await testCreateOrder(),
    getAllOrders: await testGetAllOrders(),
    createRazorpayOrder: await testCreateRazorpayOrder(),
    paymentSuccessRedirect: await testPaymentSuccessRedirect()
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
    console.log('🎉 All order controller functions working correctly!');
  } else {
    console.log('⚠️ Some functions failed. Check the implementation.');
  }
  
  return results;
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      testCreateOrder();
      break;
    case 'orders':
      testGetAllOrders();
      break;
    case 'razorpay':
      testCreateRazorpayOrder();
      break;
    case 'redirect':
      testPaymentSuccessRedirect();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

module.exports = {
  testCreateOrder,
  testGetAllOrders,
  testCreateRazorpayOrder,
  testPaymentSuccessRedirect,
  runAllTests
};