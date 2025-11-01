/**
 * Cleanup Stuck Orders
 * Remove all pending orders that are causing issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WhatsAppOrder = require('./src/models/WhatsAppOrder');

async function cleanupStuckOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testPhone = '917498780950';

    // Find all pending orders
    const pendingOrders = await WhatsAppOrder.find({
      phoneNumber: testPhone,
      status: { $in: ['pending_details', 'pending_payment'] }
    });

    console.log(`\n🔍 Found ${pendingOrders.length} pending orders for ${testPhone}`);

    // Delete all pending orders
    const result = await WhatsAppOrder.deleteMany({
      phoneNumber: testPhone,
      status: { $in: ['pending_details', 'pending_payment'] }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} pending orders`);

    // Verify cleanup
    const remainingPending = await WhatsAppOrder.find({
      phoneNumber: testPhone,
      status: { $in: ['pending_details', 'pending_payment'] }
    });

    console.log(`✅ Remaining pending orders: ${remainingPending.length}`);

    // Show remaining orders
    const allOrders = await WhatsAppOrder.find({ phoneNumber: testPhone });
    console.log(`\n📋 All remaining orders for ${testPhone}:`);
    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Status: ${order.status}, Items: ${order.items.length}, Total: ₹${order.totalAmount}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupStuckOrders();