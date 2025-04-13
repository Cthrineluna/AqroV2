const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const containerRoutes = require('./routes/containerRoutes');
const containerTypeRoutes = require('./routes/containerTypeRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const rebateRoutes = require('./routes/rebateRoutes');
const { userRoutes, adminUserRoutes } = require('./routes/userRoutes');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/container-types', containerTypeRoutes);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/containers/qrcode', cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  exposedHeaders: ['Content-Type']
}));
app.use('/api/rebates', rebateRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aqro')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/authRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api', approvalRoutes); // Add approval routes with /api prefix

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to aQRo API' });
});
app.use('/api/activities', require('./routes/activityRoutes'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;