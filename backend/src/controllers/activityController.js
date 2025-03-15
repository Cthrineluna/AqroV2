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

// Record a new activity
exports.recordActivity = async (req, res) => {
  try {
    const { containerId, type, amount, location, notes, status } = req.body;
    const userId = req.user._id;
    
    // Verify container exists
    const container = await Container.findById(containerId);
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    const newActivity = new Activity({
      userId,
      containerId,
      containerTypeId: container.containerTypeId,
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