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
router.get('/payment-success', orderController.handlePaymentSuccess);

module.exports = router; 