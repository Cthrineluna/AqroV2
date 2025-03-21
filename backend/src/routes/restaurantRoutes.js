const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const restaurantController = require('../controllers/restaurantController');

// Get all active restaurants
router.get('/', protect, authorize('admin', 'staff'), restaurantController.getRestaurants);

// Get a single restaurant by ID
router.get('/:restaurantId', protect, authorize('admin', 'staff'), restaurantController.getRestaurantById);

module.exports = router;
