const Dish = require('../models/Dish');
const fs = require('fs');
const path = require('path');

// Create a new dish
exports.createDish = async (req, res) => {
  try {
    const { name, price, available, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const dish = new Dish({
      name,
      price: Number(price),
      imageUrl,
      available: available !== undefined ? available === 'true' : true,
      description
    });
    const savedDish = await dish.save();
    res.status(201).json(savedDish);
  } catch (err) {
    res.status(400).json({ error: err.message }); // Always send JSON on error
  }
};

// Get all dishes
exports.getAllDishes = async (req, res) => {
  try {
    const dishes = await Dish.find();
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get dish by ID
exports.getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ error: 'Dish not found' });
    res.json(dish);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a dish
exports.updateDish = async (req, res) => {
  try {
    const { name, price, available, description } = req.body;
    let update = { name, price: Number(price) };
    if (available !== undefined) update.available = available === 'true';
    if (description !== undefined) update.description = description;
    if (req.file) {
      update.imageUrl = `/uploads/${req.file.filename}`;
    }
    const dish = await Dish.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!dish) return res.status(404).json({ error: 'Dish not found' });
    res.json(dish);
  } catch (err) {
    res.status(400).json({ error: err.message }); // Always send JSON on error
  }
};

// Delete a dish
exports.deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ error: 'Dish not found' });
    // Optionally delete the image file
    if (dish.imageUrl) {
      const imgPath = path.join(__dirname, '../../', dish.imageUrl);
      fs.unlink(imgPath, (err) => {}); // ignore error
    }
    res.json({ message: 'Dish deleted' }); // Always send JSON
  } catch (err) {
    res.status(400).json({ error: err.message }); // Always send JSON on error
  }
}; 