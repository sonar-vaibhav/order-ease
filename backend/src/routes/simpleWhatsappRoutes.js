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

    console.log('💳 Payment success callback:', { razorpay_payment_id, razorpay_payment_link_id });

    // Try to find order by payment link notes
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const paymentLink = await razorpay.paymentLink.fetch(razorpay_payment_link_id);
      console.log('📋 Payment link details:', paymentLink.notes);

      if (paymentLink && paymentLink.notes && paymentLink.notes.whatsapp_order_id) {
        // Using WhatsAppOrder collection
        const WhatsAppOrder = require('../models/WhatsAppOrder');
        const whatsappOrder = await WhatsAppOrder.findById(paymentLink.notes.whatsapp_order_id);
        
        if (whatsappOrder) {
          const PaymentNotifications = require('../whatsapp/paymentNotifications');
          await PaymentNotifications.handlePaymentSuccess({
            razorpay_payment_id,
            whatsapp_order_id: whatsappOrder._id,
            phoneNumber: whatsappOrder.phoneNumber
          });

          return res.redirect(`https://order-ease-i1t7.onrender.com/track?payment_success=true&source=whatsapp`);
        }
      }

      // Try to find in main Order collection (simplified approach)
      const Order = require('../models/Order');
      const pendingOrder = await Order.findOne({
        status: 'pending_payment',
        source: 'whatsapp'
      }).sort({ createdAt: -1 });

      if (pendingOrder) {
        // Update order status
        pendingOrder.status = 'queued';
        pendingOrder.paymentDetails = {
          razorpay_payment_id: razorpay_payment_id,
          payment_status: 'completed'
        };
        await pendingOrder.save();

        // Send WhatsApp notification
        const PaymentNotifications = require('../whatsapp/paymentNotifications');
        await PaymentNotifications.sendPaymentSuccessMessage(pendingOrder.customer.phone, pendingOrder);

        return res.redirect(`https://order-ease-i1t7.onrender.com/track?order_id=${pendingOrder.displayOrderId}&payment_success=true&source=whatsapp`);
      }

    } catch (error) {
      console.error('Error processing payment success:', error);
    }

    return res.redirect('https://order-ease-i1t7.onrender.com/track?error=order_not_found');

  } catch (error) {
    console.error('Error handling payment success:', error);
    return res.redirect('https://order-ease-i1t7.onrender.com/track?error=processing_error');
  }
});

// Payment failure webhook
router.post('/payment-failed', async (req, res) => {
  try {
    const { phoneNumber, orderId, reason } = req.body;

    console.log('💳 Payment failed:', { phoneNumber, orderId, reason });

    if (phoneNumber) {
      const PaymentNotifications = require('../whatsapp/paymentNotifications');
      await PaymentNotifications.handlePaymentFailure({
        phoneNumber,
        orderId,
        reason
      });
    }

    res.json({ success: true, message: 'Payment failure notification sent' });

  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(500).json({ error: 'Failed to process payment failure' });
  }
});

// Razorpay webhook for payment updates
router.post('/razorpay-webhook', async (req, res) => {
  try {
    const RazorpayWebhookHandler = require('../whatsapp/razorpayWebhook');
    await RazorpayWebhookHandler.handleWebhook(req, res);
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;