const mongoose = require('mongoose');

// WhatsApp Order schema for tracking orders placed via WhatsApp
const whatsappOrderSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
    }
  ],
  customer: {
    name: String,
    phone: String,
    address: String,
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending_details',    // Waiting for customer details
      'pending_payment',    // Waiting for payment
      'paid',              // Payment completed
      'payment_failed',    // Payment failed
      'cancelled'          // Order cancelled
    ],
    default: 'pending_details'
  },
  paymentId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpayPaymentLinkId: {
    type: String,
    default: null
  },
  mainOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  messageHistory: [
    {
      type: {
        type: String,
        enum: [
          'order_request',
          'customer_details',
          'payment_link_sent',
          'payment_success',
          'payment_failed',
          'order_confirmation',
          'status_update',
          'tracking_request'
        ]
      },
      content: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      direction: {
        type: String,
        enum: ['incoming', 'outgoing'],
        default: 'incoming'
      }
    }
  ],
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: {
      type: String,
      default: 'whatsapp'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
whatsappOrderSchema.index({ phoneNumber: 1, status: 1 });
whatsappOrderSchema.index({ razorpayPaymentId: 1 });
whatsappOrderSchema.index({ mainOrderId: 1 });
whatsappOrderSchema.index({ createdAt: -1 });

// Virtual for getting the main order
whatsappOrderSchema.virtual('mainOrder', {
  ref: 'Order',
  localField: 'mainOrderId',
  foreignField: '_id',
  justOne: true
});

// Method to add message to history
whatsappOrderSchema.methods.addMessage = function(type, content, direction = 'incoming') {
  this.messageHistory.push({
    type,
    content,
    direction,
    timestamp: new Date()
  });
  return this.save();
};

// Method to get order summary
whatsappOrderSchema.methods.getOrderSummary = function() {
  const summary = {
    orderId: this._id,
    phoneNumber: this.phoneNumber,
    totalAmount: this.totalAmount,
    status: this.status,
    itemCount: this.items.length,
    totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: this.createdAt
  };

  if (this.customer) {
    summary.customerName = this.customer.name;
  }

  if (this.mainOrderId) {
    summary.mainOrderId = this.mainOrderId;
  }

  return summary;
};

// Static method to find pending orders for a phone number
whatsappOrderSchema.statics.findPendingOrder = function(phoneNumber) {
  return this.findOne({
    phoneNumber,
    status: { $in: ['pending_details', 'pending_payment'] }
  }).sort({ createdAt: -1 });
};

// Static method to find orders by phone number
whatsappOrderSchema.statics.findByPhoneNumber = function(phoneNumber, limit = 10) {
  return this.find({ phoneNumber })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('mainOrder');
};

// Pre-save middleware to validate items
whatsappOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    // Recalculate total amount
    this.totalAmount = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// Pre-save middleware to add metadata
whatsappOrderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata = {
      ...this.metadata,
      source: 'whatsapp'
    };
  }
  next();
});

module.exports = mongoose.model('WhatsAppOrder', whatsappOrderSchema);