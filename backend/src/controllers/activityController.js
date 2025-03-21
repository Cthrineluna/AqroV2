const Activity = require('../models/Activity');
const Container = require('../models/Container');
const ContainerType = require('../models/ContainerType');

// Get recent activities for a user
exports.getRecentActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;
    
    const activities = await Activity.find({ userId })
      .populate({
        path: 'containerId',
        populate: {
          path: 'containerTypeId'
        }
      })
      .populate('restaurantId') // Add this line to populate restaurant data
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get all activities for a user with pagination
exports.getAllActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find({ userId })
      .populate({
        path: 'containerId',
        populate: {
          path: 'containerTypeId'
        }
      })
      .populate('restaurantId') // Add this line to populate restaurant data
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Activity.countDocuments({ userId });
    
    res.json({
      activities,
      page,
      totalPages: Math.ceil(total / limit),
      totalActivities: total
    });
  } catch (error) {
    console.error('Error fetching all activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Add to activityController.js
exports.getRestaurantActivities = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    
    if (!restaurantId) {
      return res.status(400).json({ message: 'Staff not associated with any restaurant' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find({ restaurantId })
      .populate({
        path: 'containerId',
        populate: {
          path: 'containerTypeId'
        }
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName email'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Activity.countDocuments({ restaurantId });
    
    res.json({
      activities,
      page,
      totalPages: Math.ceil(total / limit),
      totalActivities: total
    });
  } catch (error) {
    console.error('Error fetching restaurant activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Record a new activity
// Modify recordActivity in activityController.js
exports.recordActivity = async (req, res) => {
  try {
    const { containerId, type, amount, location, notes, status } = req.body;
    const userId = req.user._id;
    const restaurantId = req.user.restaurantId;
    
    // Verify container exists
    const container = await Container.findById(containerId);
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    const newActivity = new Activity({
      userId,
      containerId,
      containerTypeId: container.containerTypeId,
      restaurantId, // Add restaurant ID
      type,
      amount: amount || 0,
      status: status || 'completed',
      location,
      notes
    });
    
    await newActivity.save();
    
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Error recording activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};