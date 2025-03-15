const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// Get recent activities
router.get('/recent', protect, activityController.getRecentActivities);

// Get all activities with pagination
router.get('/', protect, activityController.getAllActivities);

// Record a new activity
router.post('/', protect, activityController.recordActivity);

module.exports = router;