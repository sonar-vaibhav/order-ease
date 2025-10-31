const mongoose = require('mongoose');

// Order schema defines the structure of an order document
const orderSchema = new mongoose.Schema({
  items: [
    {
      name: String, // item name
      quantity: Number, // how many ordered
      price: Number, // price per item
    }
  ],
  customer: {
    name: String, // customer name
    phone: String, // contact number
    address: String, // delivery address
  },
  status: {
    type: String,
    enum: ['queued', 'preparing', 'ready', 'picked'], // allowed statuses
    default: 'queued',
  },
  displayOrderId: {
    type: String,
    unique: true,
    required: true,
  },
  timeRequired: {
    type: Number, // in minutes
    default: null,
  },
  preparationStartedAt: {
    type: Date,
    default: null,
  },
  // Payment details for tracking payment status
  paymentDetails: {
    razorpay_payment_id: String,
    razorpay_order_id: String,
    razorpay_signature: String,
    payment_status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    amount: Number, // amount in rupees
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Order source tracking
  source: {
    type: String,
    enum: ['website', 'whatsapp'],
    default: 'website'
  },
  // Additional metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
}, { timestamps: true }); // adds createdAt and updatedAt

// Index for efficient queries
orderSchema.index({ displayOrderId: 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.razorpay_payment_id': 1 });
orderSchema.index({ 'paymentDetails.razorpay_order_id': 1 });

// Virtual for total amount calculation
orderSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Method to check if order is paid
orderSchema.methods.isPaid = function() {
  return this.paymentDetails && this.paymentDetails.payment_status === 'completed';
};

// Method to get order summary
orderSchema.methods.getOrderSummary = function() {
  return {
    id: this.displayOrderId,
    status: this.status,
    totalAmount: this.totalAmount,
    itemCount: this.items.length,
    customerName: this.customer?.name,
    isPaid: this.isPaid(),
    createdAt: this.createdAt,
    source: this.source
  };
};

module.exports = mongoose.model('Order', orderSchema); 