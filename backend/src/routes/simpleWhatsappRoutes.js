const express = require('express');
const router = express.Router();
const SimpleWhatsAppWebhook = require('../whatsapp/simpleWebhook');

// WhatsApp webhook verification (GET request)
// This endpoint handles Meta's webhook verification
router.get('/webhook', SimpleWhatsAppWebhook.verifyWebhook);

// WhatsApp webhook for incoming messages (POST request)
// This endpoint receives all incoming WhatsApp messages
router.post('/webhook', SimpleWhatsAppWebhook.handleIncomingMessage);

// Test endpoint to send messages manually
router.post('/send-test-message', SimpleWhatsAppWebhook.sendTestMessage);

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