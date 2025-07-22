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
}, { timestamps: true }); // adds createdAt and updatedAt

module.exports = mongoose.model('Order', orderSchema); 