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
// Add to activityController.js
exports.getAllActivitiesAdmin = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find({})
      .populate({
        path: 'containerId',
        populate: {
          path: 'containerTypeId'
        }
      })
      .populate('restaurantId')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Activity.countDocuments({});
    
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

// Add this to your existing activityController.js file
// Add this new function to your existing activityController.js file

// Get activity reports with advanced filtering
// In activityController.js - modify the getActivityReportsFiltered function
exports.getActivityReportsFiltered = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      restaurantIds, // Changed from restaurantId
      userIds,      // Changed from userId
      containerTypeIds // Changed from containerTypeId
    } = req.query;
    
    const userRole = req.user.userType;
    const currentUserId = req.user._id;
    const currentUserRestaurantId = req.user.restaurantId;
    
    // Build query based on filters
    let query = {};
    
    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // User role based restrictions
    if (userRole === 'admin') {
      // Handle restaurantIds as array
      if (restaurantIds) {
        query.restaurantId = Array.isArray(restaurantIds) 
          ? { $in: restaurantIds }
          : restaurantIds;
      }
      
      // Handle userIds as array
      if (userIds) {
        query.userId = Array.isArray(userIds)
          ? { $in: userIds }
          : userIds;
      }
    } else if (userRole === 'staff') {
      // Staff can only see their restaurant's data
      query.restaurantId = currentUserRestaurantId;
    } else {
      // Customers can only see their own data
      query.userId = currentUserId;
    }
    
    // Handle containerTypeIds as array
    if (containerTypeIds) {
      query.containerTypeId = Array.isArray(containerTypeIds)
        ? { $in: containerTypeIds }
        : containerTypeIds;
    }
    
    // Rest of the function remains the same...
    const activities = await Activity.find(query)
      .populate({
        path: 'containerId',
        populate: {
          path: 'containerTypeId'
        }
      })
      .populate('restaurantId')
      .populate({
        path: 'userId',
        select: 'firstName lastName email'
      })
      .populate('containerTypeId')
      .sort({ createdAt: -1 });
    
    const totalActivities = activities.length;
    
    let totalRebateAmount = 0;
    if (!type || type === 'all' || type === 'rebate') {
      totalRebateAmount = activities
        .filter(activity => activity.type === 'rebate')
        .reduce((sum, activity) => sum + (activity.amount || 0), 0);
    }
    
    res.json({
      activities,
      totalActivities,
      totalRebateAmount
    });
    
  } catch (error) {
    console.error('Error generating filtered activity reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get activity reports for analytics
exports.getActivityReports = async (req, res) => {
  try {
    const { type, timeFrame } = req.query;
    const userId = req.user._id;
    const userType = req.user.userType;
    const restaurantId = req.user.restaurantId;
    
    // Define date ranges based on timeFrame
    const now = new Date();
    let startDate;
    
    switch (timeFrame) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }
    
    // Build query based on user type
    let query = { createdAt: { $gte: startDate } };
    
    if (userType === 'staff') {
      query.restaurantId = restaurantId;
    } else if (userType === 'customer') {
      query.userId = userId;
    }
    // Admin can see all data, so no additional filters needed
    
    // Different aggregations based on report type
    let aggregation;
    
    if (type === 'activity') {
      // Group activities by day
      aggregation = await Activity.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Format for chart display
      const labels = [];
      const data = [];
      
      aggregation.forEach(item => {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        data.push(item.count);
      });
      
      return res.json({
        labels,
        datasets: [{ data }],
        legend: ['Container Activity']
      });
      
    } else if (type === 'rebate') {
      // Group rebates by day
      aggregation = await Activity.aggregate([
        { $match: { ...query, type: 'rebate' } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            totalAmount: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Format for chart display
      const labels = [];
      const data = [];
      
      aggregation.forEach(item => {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        data.push(item.totalAmount);
      });
      
      return res.json({
        labels,
        datasets: [{ data }],
        legend: ['Rebate Amounts ($)']
      });
      
    } else if (type === 'container') {
      // Group by container type
      aggregation = await Activity.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'containertypes',
            localField: 'containerTypeId',
            foreignField: '_id',
            as: 'containerType'
          }
        },
        { $unwind: '$containerType' },
        {
          $group: {
            _id: '$containerType.name',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Format for chart display
      const labels = [];
      const data = [];
      
      aggregation.forEach(item => {
        labels.push(item._id);
        data.push(item.count);
      });
      
      return res.json({
        labels,
        datasets: [{ data }],
        legend: ['Container Usage']
      });
    }
    
    // Default response if type not specified
    res.status(400).json({ message: 'Invalid report type specified' });
    
  } catch (error) {
    console.error('Error generating activity reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};