require('dotenv').config();
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const moment = require('moment-timezone');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    // 1. Get current date in IST
    const nowIST = moment().tz('Asia/Kolkata');
    const datePrefix = nowIST.format('YYYYMMDD');

    // 2. Find the highest displayOrderId for today
    const todayStart = nowIST.clone().startOf('day');
    const todayEnd = nowIST.clone().endOf('day');
    const latestOrder = await Order.findOne({
      createdAt: { $gte: todayStart.toDate(), $lte: todayEnd.toDate() },
      displayOrderId: { $regex: `^${datePrefix}-` }
    })
      .sort({ displayOrderId: -1 })
      .exec();

    let nextNumber = 1;
    if (latestOrder && latestOrder.displayOrderId) {
      const match = latestOrder.displayOrderId.match(/-(\d{3})$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const displayOrderId = `${datePrefix}-${String(nextNumber).padStart(3, '0')}`;

    // 3. Create order with displayOrderId
    const order = new Order({ ...req.body, displayOrderId });
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    // Sort by createdAt in descending order (newest first)
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update order details (status, timeRequired)
exports.updateOrder = async (req, res) => {
  try {
    const { status, timeRequired } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
    }
    if (timeRequired !== undefined) {
      updateData.timeRequired = timeRequired;
    }

    // If status is moved to 'preparing' for the first time, set the start time
    if (status === 'preparing') {
      const order = await Order.findById(req.params.id);
      if (order && !order.preparationStartedAt) {
        updateData.preparationStartedAt = new Date();
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        order_id: orderId,
        source: 'website'
      }
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle payment success for website orders
exports.handlePaymentSuccess = async (req, res) => {
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

    // Find the order by payment ID or order ID
    // First try to find by existing payment details
    let order = await Order.findOne({
      $or: [
        { 'paymentDetails.razorpay_order_id': razorpay_order_id },
        { 'paymentDetails.razorpay_payment_id': razorpay_payment_id }
      ]
    });

    // If not found, try to find by Razorpay order details
    if (!order) {
      // Get order details from Razorpay to find the order_id in notes
      try {
        const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (razorpayOrder && razorpayOrder.notes && razorpayOrder.notes.order_id) {
          order = await Order.findOne({ displayOrderId: razorpayOrder.notes.order_id });
        }
      } catch (razorpayError) {
        console.error('Error fetching Razorpay order:', razorpayError);
      }
    }

    if (order) {
      // Update order with payment details
      order.paymentDetails = {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        payment_status: 'completed'
      };
      order.status = 'queued'; // Move to queued after payment
      await order.save();

      // Redirect to track page with order ID
      return res.redirect(`https://order-ease-i1t7.onrender.com/track?order_id=${order.displayOrderId}&payment_success=true&source=website`);
    } else {
      // Order not found, redirect with error
      return res.redirect('https://order-ease-i1t7.onrender.com/track?error=order_not_found');
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
    return res.redirect('https://order-ease-i1t7.onrender.com/track?error=processing_error');
  }
};