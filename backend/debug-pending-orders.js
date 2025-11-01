/**
 * Debug Pending Orders
 * Check what's happening with pending orders in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WhatsAppOrder = require('./src/models/WhatsAppOrder');

async function debugPendingOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testPhone = '917498780950'; // Your test phone number

    // Check all orders for this phone number
    const allOrders = await WhatsAppOrder.find({ phoneNumber: testPhone });
    console.log(`\n📋 All orders for ${testPhone}:`, allOrders.length);
    
    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Status: ${order.status}, Items: ${order.items.length}, Total: ₹${order.totalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   ID: ${order._id}`);
    });

    // Check specifically for pending_details orders
    const pendingOrders = await WhatsAppOrder.find({ 
      phoneNumber: testPhone, 
      status: 'pending_details' 
    });
    console.log(`\n⏳ Pending orders for ${testPhone}:`, pendingOrders.length);
    
    pendingOrders.forEach((order, index) => {
      console.log(`${index + 1}. Items: ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`);
      console.log(`   Total: ₹${order.totalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
    });

    // Create a test pending order
    console.log('\n🧪 Creating test pending order...');
    const testOrder = new WhatsAppOrder({
      phoneNumber: testPhone,
      items: [
        { name: 'Test Pizza', quantity: 1, price: 250 }
      ],
      totalAmount: 250,
      status: 'pending_details'
    });

    await testOrder.save();
    console.log('✅ Test order created:', testOrder._id);

    // Verify it was saved
    const savedOrder = await WhatsAppOrder.findById(testOrder._id);
    console.log('✅ Test order verified:', savedOrder ? 'Found' : 'Not found');

    // Clean up test order
    await WhatsAppOrder.findByIdAndDelete(testOrder._id);
    console.log('🗑️ Test order cleaned up');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPendingOrders();