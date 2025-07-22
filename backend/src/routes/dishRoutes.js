const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const multer = require('multer');
const path = require('path');

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Create dish (with image)
router.post('/dishes', upload.single('image'), dishController.createDish);

// Get all dishes
router.get('/dishes', dishController.getAllDishes);

// Get dish by ID
router.get('/dishes/:id', dishController.getDishById);

// Update dish (with optional new image)
router.patch('/dishes/:id', upload.single('image'), dishController.updateDish);

// Delete dish
router.delete('/dishes/:id', dishController.deleteDish);

module.exports = router; 