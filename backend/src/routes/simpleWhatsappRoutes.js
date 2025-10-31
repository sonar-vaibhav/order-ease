const express = require('express');
const router = express.Router();
const SimpleWhatsAppController = require('../whatsapp/simpleController');

// WhatsApp webhook verification (GET request)
router.get('/webhook', SimpleWhatsAppController.verifyWebhook);

// WhatsApp webhook for incoming messages (POST request)
router.post('/webhook', SimpleWhatsAppController.handleIncomingMessage);

// Test endpoint to send messages manually
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

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'WhatsApp webhook is running',
    timestamp: new Date().toISOString(),
    webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/whatsapp/webhook`
  });
});

module.exports = router;