const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create new order
router.post('/orders', orderController.createOrder);

// Get order by ID
router.get('/orders/:id', orderController.getOrderById);

// Update order status
router.patch('/orders/:id', orderController.updateOrder);

// Get all orders
router.get('/orders', orderController.getAllOrders);

// Create Razorpay order
router.post('/create-razorpay-order', orderController.createRazorpayOrder);

// Handle payment success callback for website orders
router.get('/payment-success', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.query;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return res.redirect('https://order-ease-i1t7.onrender.com/track?error=payment_info_missing');
    }

    // Verify payment signature (optional but recommended)
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (razorpay_signature && razorpay_signature !== expectedSignature) {
      console.error('Invalid payment signature');
      return res.redirect('https://order-ease-i1t7.onrender.com/track?error=invalid_signature');
    }

    // For now, just redirect to track page with success
    return res.redirect(`https://order-ease-i1t7.onrender.com/track?payment_success=true&source=website`);

  } catch (error) {
    console.error('Error handling payment success:', error);
    return res.redirect('https://order-ease-i1t7.onrender.com/track?error=processing_error');
  }
});

module.exports = router; 