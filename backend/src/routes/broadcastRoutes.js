const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const WhatsAppService = require('../whatsapp/whatsappService');

// Add CORS headers for broadcast routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Broadcast model for storing broadcast history
const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['all', 'recent'], required: true },
  sentCount: { type: Number, default: 0 },
  sentAt: { type: Date, default: Date.now },
  sentBy: { type: String, default: 'admin' }
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

// Test endpoint
router.get('/broadcast-test', (req, res) => {
  res.json({ 
    message: 'Broadcast routes are working!', 
    timestamp: new Date(),
    cors: 'CORS headers applied',
    origin: req.headers.origin || 'No origin header'
  });
});

// Send broadcast message
router.post('/broadcast', async (req, res) => {
  try {
    const { message, type } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get customer phone numbers based on type
    let customers = [];
    
    if (type === 'recent') {
      // Get customers from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentOrders = await Order.find({
        createdAt: { $gte: thirtyDaysAgo },
        'customer.phone': { $exists: true, $ne: null }
      }).select('customer.phone customer.name');
      
      // Get unique customers
      const uniqueCustomers = new Map();
      recentOrders.forEach(order => {
        if (order.customer.phone) {
          uniqueCustomers.set(order.customer.phone, {
            phone: order.customer.phone,
            name: order.customer.name
          });
        }
      });
      
      customers = Array.from(uniqueCustomers.values());
    } else {
      // Get all customers
      const allOrders = await Order.find({
        'customer.phone': { $exists: true, $ne: null }
      }).select('customer.phone customer.name');
      
      // Get unique customers
      const uniqueCustomers = new Map();
      allOrders.forEach(order => {
        if (order.customer.phone) {
          uniqueCustomers.set(order.customer.phone, {
            phone: order.customer.phone,
            name: order.customer.name
          });
        }
      });
      
      customers = Array.from(uniqueCustomers.values());
    }

    console.log(`📢 Broadcasting to ${customers.length} customers`);

    // Filter to only whitelisted numbers for now
    const whitelistedNumbers = ['917498780950']; // Add more numbers as needed
    const whitelistedCustomers = customers.filter(customer => 
      whitelistedNumbers.includes(customer.phone)
    );

    console.log(`📢 Broadcasting to ${whitelistedCustomers.length} whitelisted customers out of ${customers.length} total`);

    // Send messages
    let sentCount = 0;
    const broadcastMessage = `📢 *OrderEase*\n\n${message}\n\n_Reply to this message to place an order!_`;

    // Check if WhatsApp service is available
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️ WhatsApp not configured - simulating broadcast');
      sentCount = whitelistedCustomers.length; // Simulate success for testing
    } else {
      for (const customer of whitelistedCustomers) {
        try {
          const success = await WhatsAppService.sendMessage(customer.phone, broadcastMessage);
          if (success) {
            sentCount++;
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to send to ${customer.phone}:`, error);
        }
      }
    }

    // Save broadcast history
    const broadcast = new Broadcast({
      message,
      type,
      sentCount,
      sentAt: new Date()
    });
    await broadcast.save();

    console.log(`✅ Broadcast sent to ${sentCount}/${whitelistedCustomers.length} whitelisted customers (${customers.length} total customers)`);

    res.json({
      success: true,
      sentCount,
      whitelistedCustomers: whitelistedCustomers.length,
      totalCustomers: customers.length,
      message: `Broadcast sent to ${sentCount} whitelisted customers`
    });

  } catch (error) {
    console.error('❌ Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Get broadcast history
router.get('/broadcast-history', async (req, res) => {
  try {
    const broadcasts = await Broadcast.find()
      .sort({ sentAt: -1 })
      .limit(20);

    res.json(broadcasts);
  } catch (error) {
    console.error('❌ Error fetching broadcast history:', error);
    res.status(500).json({ error: 'Failed to fetch broadcast history' });
  }
});

// Get broadcast statistics
router.get('/broadcast-stats', async (req, res) => {
  try {
    const totalBroadcasts = await Broadcast.countDocuments();
    const totalMessagesSent = await Broadcast.aggregate([
      { $group: { _id: null, total: { $sum: '$sentCount' } } }
    ]);

    // Get unique customers count
    const uniqueCustomers = await Order.distinct('customer.phone', {
      'customer.phone': { $exists: true, $ne: null }
    });

    res.json({
      totalBroadcasts,
      totalMessagesSent: totalMessagesSent[0]?.total || 0,
      uniqueCustomers: uniqueCustomers.length
    });
  } catch (error) {
    console.error('❌ Error fetching broadcast stats:', error);
    res.status(500).json({ error: 'Failed to fetch broadcast stats' });
  }
});

module.exports = router;