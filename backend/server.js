const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const orderRoutes = require('./src/routes/orderRoutes'); // import order routes
const dishRoutes = require('./src/routes/dishRoutes'); // import dish routes
const whatsappRoutes = require('./src/routes/whatsappRoutes'); // import whatsapp routes
const simpleWhatsappRoutes = require('./src/routes/simpleWhatsappRoutes'); // import simple whatsapp routes
const broadcastRoutes = require('./src/routes/broadcastRoutes'); // import broadcast routes

// Razorpay configuration loaded from environment variables


dotenv.config();

const app = express();

// Universal CORS configuration - Allow all methods and origins for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Additional CORS middleware as backup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],
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
app.use('/api', broadcastRoutes); // use broadcast routes under /api
// Choose one of these - comment out the other
app.use('/api/whatsapp', simpleWhatsappRoutes); // use simple whatsapp routes (working version)
// app.use('/api/whatsapp', whatsappRoutes); // use full whatsapp routes (complex version)

// Simple error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 