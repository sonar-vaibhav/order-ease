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

// Payment success callback for WhatsApp orders
router.get('/payment-success', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_payment_link_id } = req.query;

    if (!razorpay_payment_id || !razorpay_payment_link_id) {
      return res.redirect('https://order-ease-i1t7.onrender.com/track?error=payment_info_missing');
    }

    // Find the WhatsApp order
    const WhatsAppOrder = require('../models/WhatsAppOrder');
    const whatsappOrder = await WhatsAppOrder.findOne({
      _id: req.query.whatsapp_order_id || null
    });

    if (!whatsappOrder) {
      // Try to find by payment link notes
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const paymentLink = await razorpay.paymentLink.fetch(razorpay_payment_link_id);
        if (paymentLink && paymentLink.notes && paymentLink.notes.whatsapp_order_id) {
          const foundOrder = await WhatsAppOrder.findById(paymentLink.notes.whatsapp_order_id);
          if (foundOrder) {
            // Update order with payment details
            foundOrder.razorpayPaymentId = razorpay_payment_id;
            foundOrder.status = 'paid';
            await foundOrder.save();

            // Create main order
            const SimpleOrderBot = require('../whatsapp/simpleOrderBot');
            await SimpleOrderBot.createMainOrder(foundOrder);

            return res.redirect(`https://order-ease-i1t7.onrender.com/track?payment_success=true&source=whatsapp`);
          }
        }
      } catch (error) {
        console.error('Error processing payment:', error);
      }

      return res.redirect('https://order-ease-i1t7.onrender.com/track?error=order_not_found');
    }

    // Update order with payment details
    whatsappOrder.razorpayPaymentId = razorpay_payment_id;
    whatsappOrder.status = 'paid';
    await whatsappOrder.save();

    // Create main order
    const SimpleOrderBot = require('../whatsapp/simpleOrderBot');
    await SimpleOrderBot.createMainOrder(whatsappOrder);

    // Redirect to track page
    return res.redirect(`https://order-ease-i1t7.onrender.com/track?payment_success=true&source=whatsapp`);

  } catch (error) {
    console.error('Error handling payment success:', error);
    return res.redirect('https://order-ease-i1t7.onrender.com/track?error=processing_error');
  }
});

module.exports = router;