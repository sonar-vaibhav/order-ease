const mongoose = require('mongoose');

// Chat session schema for tracking user conversation state
const chatSessionSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  stage: {
    type: String,
    enum: [
      'welcome',           // Initial greeting
      'browsing',          // Looking at menu
      'ordering',          // Building order
      'confirming_order',  // Confirming quantities and items
      'collecting_details', // Getting customer info
      'payment_pending',   // Waiting for payment
      'order_placed',      // Order successfully placed
      'tracking'           // Tracking existing order
    ],
    default: 'welcome'
  },
  context: {
    // Current order being built
    pendingOrder: {
      items: [{
        name: String,
        quantity: Number,
        price: Number
      }],
      totalAmount: Number
    },
    // Customer details
    customerInfo: {
      name: String,
      phone: String,
      address: String
    },
    // Last interaction
    lastMessage: String,
    lastMessageTime: Date,
    // Conversation history (last 10 messages)
    messageHistory: [{
      message: String,
      timestamp: Date,
      type: { type: String, enum: ['user', 'bot'] }
    }],
    // Retry counts for failed parsing
    retryCount: {
      type: Number,
      default: 0
    }
  },
  // Session metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Auto-expire sessions after 30 minutes of inactivity
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    index: { expireAfterSeconds: 0 }
  }
}, { 
  timestamps: true 
});

// Update last activity on save
chatSessionSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Reset expiry
  next();
});

// Methods
chatSessionSchema.methods.addMessage = function(message, type = 'user') {
  if (!this.context.messageHistory) {
    this.context.messageHistory = [];
  }
  
  this.context.messageHistory.push({
    message,
    timestamp: new Date(),
    type
  });
  
  // Keep only last 10 messages
  if (this.context.messageHistory.length > 10) {
    this.context.messageHistory = this.context.messageHistory.slice(-10);
  }
  
  this.context.lastMessage = message;
  this.context.lastMessageTime = new Date();
};

chatSessionSchema.methods.resetSession = function() {
  this.stage = 'welcome';
  this.context = {
    pendingOrder: { items: [], totalAmount: 0 },
    customerInfo: {},
    messageHistory: [],
    retryCount: 0
  };
  this.isActive = true;
};

chatSessionSchema.methods.updateStage = function(newStage) {
  this.stage = newStage;
  this.context.retryCount = 0; // Reset retry count on stage change
};

// Static methods
chatSessionSchema.statics.findOrCreateSession = async function(phoneNumber) {
  let session = await this.findOne({ 
    phoneNumber, 
    isActive: true 
  });
  
  if (!session) {
    session = new this({ phoneNumber });
    await session.save();
  }
  
  return session;
};

chatSessionSchema.statics.clearSession = async function(phoneNumber) {
  const session = await this.findOne({ phoneNumber, isActive: true });
  if (session) {
    session.resetSession();
    await session.save();
  }
  return session;
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);