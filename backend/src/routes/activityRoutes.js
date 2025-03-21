const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get recent activities
router.get('/recent', protect, activityController.getRecentActivities);

// Get all activities with pagination
router.get('/', protect, activityController.getAllActivities);

// Record a new activity
router.post('/', protect, activityController.recordActivity);

router.get('/restaurant', protect, authorize('staff', 'admin'), activityController.getRestaurantActivities);


module.exports = router;