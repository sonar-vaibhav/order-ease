const mongoose = require('mongoose');

// Dish schema for menu items
const dishSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  price: { type: Number, required: true }, 
  imageUrl: { type: String }, 
  available: { type: Boolean, default: true }, // is the dish available
  description: { type: String }, // dish description
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema); 