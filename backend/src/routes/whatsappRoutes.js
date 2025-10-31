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

module.exports = router;