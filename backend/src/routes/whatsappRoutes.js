const express = require('express');
const router = express.Router();
const WhatsAppController = require('../whatsapp/whatsappController');
const RazorpayWebhookHandler = require('../whatsapp/razorpayWebhook');
const WhatsAppAdminController = require('../whatsapp/adminController');

// WhatsApp webhook verification (GET request)
router.get('/webhook', WhatsAppController.verifyWebhook);

// WhatsApp webhook for incoming messages (POST request)
router.post('/webhook', WhatsAppController.handleIncomingMessage);

// Razorpay webhook for payment updates
router.post('/razorpay-webhook', RazorpayWebhookHandler.handleWebhook);

// Payment success callback page
router.get('/payment-success', RazorpayWebhookHandler.handlePaymentSuccess);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'WhatsApp full system is running',
    timestamp: new Date().toISOString(),
    webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/whatsapp/webhook`,
    features: ['Order Processing', 'Payment Integration', 'Order Tracking', 'Gemini AI']
  });
});

// Debug endpoint to check environment variables
router.get('/debug-env', (req, res) => {
  res.json({
    hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
    accessTokenLength: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    backendUrl: process.env.BACKEND_URL
  });
});

// Simple message test endpoint
router.post('/simple-message-test', async (req, res) => {
  try {
    console.log('🧪 Simple message test started');
    
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const testPhone = '917498780950';
    
    console.log('📱 Phone Number ID:', phoneNumberId);
    console.log('🔑 Access Token Length:', accessToken?.length);
    console.log('📞 Test Phone:', testPhone);
    
    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing WhatsApp credentials',
        hasPhoneId: !!phoneNumberId,
        hasToken: !!accessToken
      });
    }

    const axios = require('axios');
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: testPhone,
      type: 'text',
      text: {
        body: '🧪 Simple test from Render server! If you receive this, everything is working! 🎉'
      }
    };

    console.log('📤 Sending to URL:', url);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message sent successfully:', response.data);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      response: response.data
    });

  } catch (error) {
    console.error('❌ Error in simple message test:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to send message',
      details: error.response?.data || error.message,
      stack: error.stack
    });
  }
});

// Test endpoint to send a message (for development/testing)
router.post('/send-test-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ 
        error: 'Phone number and message are required' 
      });
    }

    const WhatsAppService = require('../whatsapp/whatsappService');
    const success = await WhatsAppService.sendMessage(to, message);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Test message sent successfully' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send test message' 
      });
    }
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get WhatsApp orders for a phone number (for debugging)
router.get('/orders/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const WhatsAppOrder = require('../models/WhatsAppOrder');
    
    const orders = await WhatsAppOrder.findByPhoneNumber(phoneNumber);
    
    res.json({
      success: true,
      orders: orders.map(order => order.getOrderSummary())
    });
  } catch (error) {
    console.error('Error fetching WhatsApp orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch orders' 
    });
  }
});

// Get WhatsApp order statistics (for admin dashboard)
router.get('/stats', async (req, res) => {
  try {
    const WhatsAppOrder = require('../models/WhatsAppOrder');
    
    const stats = await WhatsAppOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await WhatsAppOrder.countDocuments();
    const todayOrders = await WhatsAppOrder.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalOrders,
        today: todayOrders,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics' 
    });
  }
});

// Manual order status update (for testing)
router.post('/update-order-status', WhatsAppAdminController.updateOrderStatusWithNotification);

// Admin endpoints
router.get('/admin/orders', WhatsAppAdminController.getAllWhatsAppOrders);
router.get('/admin/orders/:id', WhatsAppAdminController.getWhatsAppOrderById);
router.get('/admin/stats', WhatsAppAdminController.getWhatsAppStats);
router.post('/admin/send-message', WhatsAppAdminController.sendManualMessage);
router.get('/admin/messages/:phoneNumber', WhatsAppAdminController.getMessageHistory);
router.get('/admin/conversations', WhatsAppAdminController.getActiveConversations);

// Gemini testing endpoints
router.get('/test-gemini', async (req, res) => {
  try {
    const GeminiService = require('../whatsapp/geminiService');
    const geminiService = new GeminiService();
    
    const result = await geminiService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-order-parsing', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const Dish = require('../models/Dish');
    const GeminiService = require('../whatsapp/geminiService');
    
    const dishes = await Dish.find({ available: true });
    const geminiService = new GeminiService();
    
    const result = await geminiService.parseOrder(message, dishes);
    
    res.json({
      success: true,
      message: message,
      parsedItems: result,
      availableDishes: dishes.map(d => ({ name: d.name, price: d.price }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Session management endpoints
router.post('/admin/clear-session', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const ChatSession = require('../models/ChatSession');
    const session = await ChatSession.clearSession(phoneNumber);
    
    res.json({
      success: true,
      message: `Session cleared for ${phoneNumber}`,
      session: session ? session.getOrderSummary() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/sessions', async (req, res) => {
  try {
    const ChatSession = require('../models/ChatSession');
    const sessions = await ChatSession.find({ isActive: true })
      .sort({ lastActivity: -1 })
      .limit(50);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        phoneNumber: session.phoneNumber,
        stage: session.stage,
        lastActivity: session.lastActivity,
        pendingOrder: session.context.pendingOrder,
        messageCount: session.context.messageHistory?.length || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;