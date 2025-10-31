const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const orderRoutes = require('./src/routes/orderRoutes'); // import order routes
const dishRoutes = require('./src/routes/dishRoutes'); // import dish routes
const whatsappRoutes = require('./src/routes/whatsappRoutes'); // import whatsapp routes
const simpleWhatsappRoutes = require('./src/routes/simpleWhatsappRoutes'); // import simple whatsapp routes

console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "https://order-ease-i1t7.onrender.com",
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('OrderEase API is running');
});

app.use('/uploads', express.static('uploads')); // serve images
app.use('/api', dishRoutes); // use dish routes under /api
app.use('/api', orderRoutes); // use order routes under /api
// Choose one of these - comment out the other
// app.use('/api/whatsapp', simpleWhatsappRoutes); // use simple whatsapp routes (for initial setup)
app.use('/api/whatsapp', whatsappRoutes); // use full whatsapp routes (for complete features)

// Simple error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 