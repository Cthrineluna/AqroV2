const mongoose = require('mongoose');
const Container = require('../models/Container');
const ContainerType = require('../models/ContainerType');
const Rebate = require('../models/Rebate');
const Activity = require('../models/Activity');
const QRCode = require('qrcode');
const Restaurant = require('../models/Restaurant');
const RestaurantContainerRebate = require('../models/RestaurantContainerRebate');
const axios = require('axios');

exports.deleteContainer = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if container exists
    const container = await Container.findById(id);
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }

    // Delete the container
    await Container.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: 'Container deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting container:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Add to containerController.js
exports.markContainerStatus = async (req, res) => {
  try {
    const { containerId, status } = req.body;
    const userId = req.user._id;

    // Validate status
    if (!['damaged', 'lost'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Can only mark as damaged or lost' 
      });
    }

    // Find the container
    const container = await Container.findById(containerId)
      .populate('containerTypeId')
      .populate('restaurantId');

    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }

    // Check if container is active
    if (container.status !== 'active') {
      return res.status(400).json({ 
        message: 'Container must be active to mark as damaged or lost' 
      });
    }

    // Check if user owns the container (for customers)
    if (req.user.userType === 'customer' && 
        (!container.customerId || container.customerId.toString() !== userId.toString())) {
      return res.status(403).json({ 
        message: 'You can only mark your own containers' 
      });
    }

    // Save old status for activity record
    const oldStatus = container.status;

    // Update container status
    container.status = status;
    container.lastUsed = new Date();
    await container.save();

    // Record activity
    const newActivity = new Activity({
      userId,
      containerId: container._id,
      containerTypeId: container.containerTypeId._id,
      restaurantId: container.restaurantId?._id,
      type: 'status_change',
      status: 'completed',
      notes: `From ${oldStatus} to ${status}`
    });

    await newActivity.save();

    res.status(200).json({
      success: true,
      message: `Container marked as ${status} successfully`,
      container
    });
  } catch (error) {
    console.error('Error marking container status:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};
// Create a new container (admin only)
exports.createContainer = async (req, res) => {
  try {
    const { qrCode, containerTypeId } = req.body;

    // Validate required fields
    if (!qrCode || !containerTypeId) {
      return res.status(400).json({ message: 'QR code and container type are required' });
    }

    // Verify QR code uniqueness again (defensive check)
    const existing = await Container.findOne({ qrCode });
    if (existing) {
      return res.status(400).json({ 
        message: 'QR code already in use',
        existingContainerId: existing._id 
      });
    }


    // Validate container type
    const containerType = await ContainerType.findById(containerTypeId);
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }

    // Create container
    const container = new Container({
      ...req.body,
      status: req.body.status || 'available',
      usesCount: req.body.usesCount || 0
    });

    await container.save();

    res.status(201).json(container);

  } catch (error) {
    console.error('Container creation error:', error);
    res.status(500).json({ 
      message: 'Container creation failed',
      error: error.message 
    });
  }
};

// Update an existing container (admin only)
exports.updateContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { containerTypeId, restaurantId, status, customerId, usesCount } = req.body;

    // Find container
    const container = await Container.findById(id);
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }

    // Update fields
    if (containerTypeId) {
      const containerType = await ContainerType.findById(containerTypeId);
      if (!containerType) {
        return res.status(404).json({ message: 'Container type not found' });
      }
      container.containerTypeId = containerTypeId;
    }

    if (restaurantId !== undefined) {
      container.restaurantId = restaurantId || null;
    }

    if (status) {
      container.status = status;
    }

    if (customerId !== undefined) {
      container.customerId = customerId || null;
    }

    if (usesCount !== undefined) {
      container.usesCount = usesCount;
    }

    await container.save();

    res.json(container);
  } catch (error) {
    console.error('Error updating container:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Get all containers (admin only)
exports.getAllContainers = async (req, res) => {
  try {
    const containers = await Container.find()
      .populate('containerTypeId')
      .populate('customerId', 'firstName lastName email')
      .populate('restaurantId', 'name')
      .sort({ updatedAt: -1 });
    
    res.json(containers);
  } catch (error) {
    console.error('Error getting all containers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add this method
exports.getUsers = async (req, res) => {
  try {
    const users = await mongoose.model('User').find({}, 'firstName lastName email');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate QR code image
// Get container stats for a restaurant
exports.getRestaurantContainerStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // First check if the staff user belongs to this restaurant
    if (req.user.userType === 'staff' && req.user.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Unauthorized access to restaurant data' });
    }
    
    // Get available containers count
    const availableContainers = await Container.countDocuments({
      restaurantId,
      status: 'available'
    });

    // Get active containers count
    const activeContainers = await Container.countDocuments({
      restaurantId,
      status: 'active'
    });

    // Get returned containers count
    const returnedContainers = await Container.countDocuments({
      restaurantId,
      status: 'returned'
    });

    // Get lost containers count
    const lostContainers = await Container.countDocuments({
      restaurantId,
      status: 'lost'
    });

    // Get damaged containers count
    const damagedContainers = await Container.countDocuments({
      restaurantId,
      status: 'damaged'
    });

    res.json({
      availableContainers,
      activeContainers,
      returnedContainers,
      lostContainers,
      damagedContainers
    });
  } catch (error) {
    console.error('Error getting restaurant container stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getQRCodeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const container = await Container.findById(id);
    
    if (!container) {
        return res.status(404).json({ message: 'Container not found' });
    }

    // Generate QR code as PNG buffer instead of data URL
    const qrCodeBuffer = await QRCode.toBuffer(container.qrCode);
    
    // Set appropriate headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');  // Add this line
    
    // Send image buffer directly
    res.send(qrCodeBuffer);
} catch (error) {
    console.error('Error generating QR code image:', error);
    res.status(500).json({ message: 'Server error' });
}
};

// Get container details by QR code
exports.getContainerDetailsByQR = async (req, res) => {
  try {
    const { qrCode } = req.query;
    
    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }
    
    const container = await Container.findOne({ qrCode })
      .populate('containerTypeId')
      .populate('customerId', 'firstName lastName email')
      .populate('restaurantId', 'name location');
    
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    res.json(container);
  } catch (error) {
    console.error('Error getting container details by QR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get container stats for a customer
exports.getContainerStats = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Get active containers count
    const activeContainers = await Container.countDocuments({
      customerId,
      status: 'active'
    });

    // Get returned containers count
    const returnedContainers = await Container.countDocuments({
      customerId,
      status: 'returned'
    });

    // Get lost containers count
    const lostContainers = await Container.countDocuments({
      customerId,
      status: 'lost'
    });

    // Get damaged containers count
    const damagedContainers = await Container.countDocuments({
      customerId,
      status: 'damaged'
    });

    // Get total rebate amount
    const rebates = await Rebate.find({ customerId });
    const totalRebate = rebates.reduce((total, rebate) => total + rebate.amount, 0);

    res.json({
      activeContainers,
      returnedContainers,
      lostContainers,
      damagedContainers,
      totalRebate
    });
  } catch (error) {
    console.error('Error getting container stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all containers for a customer
exports.getCustomerContainers = async (req, res) => {
  try {
    const customerId = req.user._id;
    
    const containers = await Container.find({ customerId })
      .populate('containerTypeId')
      .populate('restaurantId', 'name location')
      .sort({ updatedAt: -1 });
    
    res.json(containers);
  } catch (error) {
    console.error('Error getting customer containers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register a container to a customer
exports.registerContainer = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const customerId = req.user._id;
    
    // Check if container exists
    const container = await Container.findOne({ qrCode })
      .populate('containerTypeId');
    
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    // Check if container is already registered to the current user
    if (container.customerId && container.customerId.toString() === customerId.toString()) {
      return res.status(200).json({ 
        success: true,
        message: 'Container is already registered to your account',
        alreadyRegistered: true,
        ownedByCurrentUser: true,
        container
      });
    }
    
    // Check if container is already registered to another user
    if (container.customerId && container.customerId.toString() !== customerId.toString()) {
      return res.status(200).json({ 
        success: true,
        message: 'Container is already registered to another user',
        alreadyRegistered: true,
        ownedByCurrentUser: false
      });
    }
    
    // Only update and save the container if not already registered
    container.customerId = customerId;
    container.status = 'active';
    container.registrationDate = new Date();
    
    await container.save();

    const newActivity = new Activity({
      userId: customerId,
      containerId: container._id,
      containerTypeId: container.containerTypeId,
      restaurantId: container.restaurantId,
      type: 'registration',
      notes: 'Container registered'
    });
    
    await newActivity.save();

    // ✅ Send webhook to n8n
    try {
      const user = await mongoose.model('User').findById(customerId);
      const userEmail = user ? user.email : '';
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: "register",
        customerId: customerId,
        email: userEmail,
        containerId: container._id,
        containerType: container.containerTypeId?.name,
        restaurant: container.restaurantId?.name,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Webhook failed (registerContainer):", err.message);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Container registered successfully',
      alreadyRegistered: false,
      container
    });
  } catch (error) {
    console.error('Error registering container:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Process rebate
exports.processRebate = async (req, res) => {
  try {
    const { containerId } = req.body;
    const staffId = req.user._id;
    
    // Find the container with full population
    const container = await Container.findById(containerId)
      .populate('containerTypeId')
      .populate('customerId');
    
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    if (!container.customerId) {
      return res.status(400).json({ message: 'Container is not registered to any customer' });
    }
    
    // Check if container has reached its maximum uses
    if (container.containerTypeId.maxUses <= container.usesCount) {
      return res.status(400).json({ 
        message: 'Container has reached its maximum number of uses',
        maxUses: container.containerTypeId.maxUses,
        currentUses: container.usesCount
      });
    }
    
    // Get staff restaurant information
    const staffUser = await mongoose.model('User').findById(staffId)
      .populate('restaurantId');
    
    if (!staffUser || !staffUser.restaurantId) {
      return res.status(400).json({ message: 'Staff user is not associated with a restaurant' });
    }
    
    const restaurant = staffUser.restaurantId;

    // Find restaurant-specific rebate mapping
    const rebateMapping = await RestaurantContainerRebate.findOne({
      restaurantId: restaurant._id,
      containerTypeId: container.containerTypeId._id
    });

    if (!rebateMapping) {
      return res.status(404).json({ 
        message: 'No rebate value found for this container type and restaurant' 
      });
    }

    // Use the restaurant-specific rebate value
    const amount = rebateMapping.rebateValue;
    const customerId = container.customerId._id;
    const location = restaurant.name;
    
    // Create rebate record
    const rebate = new Rebate({
      containerId,
      customerId,
      staffId,
      amount,
      location
    });
    
    await rebate.save();
    
    // Update container status
    container.lastUsed = new Date();
    container.usesCount = (container.usesCount || 0) + 1;
    
    await container.save();
    
    // Record activity
    const newActivity = new Activity({
      userId: customerId,
      containerId,
      containerTypeId: container.containerTypeId._id,
      restaurantId: restaurant._id,
      type: 'rebate',
      amount,
      location,
      notes: 'Rebate processed'
    });
    
    await newActivity.save();

    // ✅ Send webhook to n8n
    try {
      const user = await mongoose.model('User').findById(customerId);
      const userEmail = user ? user.email : '';
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: "rebate",
        customerId: customerId,
         email: userEmail,
        containerId: container._id,
        containerType: container.containerTypeId?.name,
        restaurant: restaurant.name,
        amount,
        usesCount: container.usesCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Webhook failed (processRebate):", err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Rebate processed successfully',
      amount,
      rebate
    });
  } catch (error) {
    console.error('Error processing rebate:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message 
    });
  }
};

// New method to manage restaurant-specific rebate mappings
exports.manageRestaurantRebateMappings = async (req, res) => {
  try {
    const { restaurantId, containerTypeMappings } = req.body;

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Create or update rebate mappings
    const savedMappings = await Promise.all(
      containerTypeMappings.map(async (mapping) => {
        // Validate container type exists
        const containerType = await ContainerType.findById(mapping.containerTypeId);
        if (!containerType) {
          throw new Error(`Container type ${mapping.containerTypeId} not found`);
        }

        return RestaurantContainerRebate.findOneAndUpdate(
          {
            restaurantId: restaurantId,
            containerTypeId: mapping.containerTypeId
          },
          {
            rebateValue: mapping.rebateValue
          },
          { upsert: true, new: true }
        );
      })
    );

    res.status(200).json({
      message: 'Rebate mappings updated successfully',
      mappings: savedMappings
    });
  } catch (error) {
    console.error('Error managing rebate mappings:', error);
    res.status(500).json({ 
      message: 'Error managing rebate mappings', 
      details: error.message 
    });
  }
};

// Retrieve rebate mappings for a restaurant
exports.getRestaurantRebateMappings = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const rebateMappings = await RestaurantContainerRebate.find({ 
      restaurantId 
    }).populate('containerTypeId');

    res.status(200).json(rebateMappings);
  } catch (error) {
    console.error('Error retrieving rebate mappings:', error);
    res.status(500).json({ 
      message: 'Error retrieving rebate mappings', 
      details: error.message 
    });
  }
};

// Process container return
exports.processReturn = async (req, res) => {
  try {
    const { containerId } = req.body;
    const staffId = req.user._id;
    
    // Find the container
    const container = await Container.findById(containerId);
    
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    if (!container.customerId) {
      return res.status(400).json({ message: 'Container is not registered to any customer' });
    }
    
    if (container.status === 'returned') {
      return res.status(400).json({ message: 'Container is already marked as returned' });
    }
    
    // Get staff restaurant information
    const staffUser = await mongoose.model('User').findById(staffId)
      .populate('restaurantId');
    
    if (!staffUser || !staffUser.restaurantId) {
      return res.status(400).json({ message: 'Staff user is not associated with a restaurant' });
    }
    
    const restaurant = staffUser.restaurantId;
    const customerId = container.customerId;
    const location = restaurant.name;
    
    // Update container status
    container.status = 'returned';
    container.lastUsed = new Date();
    
    await container.save();
    
    // Record activity
    const newActivity = new Activity({
      userId: customerId,
      containerId,
      containerTypeId: container.containerTypeId,
      restaurantId: restaurant._id,
      type: 'return',
      location,
      notes: 'Container returned'
    });
    
    await newActivity.save();

    // ✅ Send webhook to n8n
    try {
      const user = await mongoose.model('User').findById(customerId);
      const userEmail = user ? user.email : '';
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: "return",
        customerId: customerId,
        email: userEmail,
        containerId: container._id,
        containerType: container.containerTypeId?.name,
        restaurant: restaurant.name,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Webhook failed (processReturn):", err.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Container marked as returned successfully',
      container
    });
  } catch (error) {
    console.error('Error processing container return:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate a QR code for a new container
exports.generateContainer = async (req, res) => {
  try {
    const { containerTypeId, restaurantId } = req.body;
    
    // Validate container type exists
    const containerType = await ContainerType.findById(containerTypeId);
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }

    // Generate unique QR code with retry logic
    let qrCode;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      // More robust generation with timestamp and random components
      const timestamp = Date.now().toString();
      const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
      qrCode = `AQRO-${randomString}-${timestamp.slice(-6)}`;
      
      // Verify uniqueness
      const exists = await Container.findOne({ qrCode }).lean();
      if (!exists) break;
      
      attempts++;
      if (attempts >= maxAttempts) {
        return res.status(500).json({ 
          message: 'Failed to generate unique QR code after multiple attempts' 
        });
      }
    }

    // Return the QR code details without creating container yet
    res.status(200).json({
      success: true,
      qrCode,
      qrCodeUrl: `/qr-codes/${qrCode}.png`,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'QR generation failed',
      error: error.message 
    });
  }
};

exports.getContainerTypes = async (req, res) => {
  try {
    const containerTypes = await ContainerType.find({ isActive: true });
    res.status(200).json(containerTypes);
  } catch (error) {
    console.error('Error fetching container types:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Retrieve rebate mappings for a specific container type across all restaurants
exports.getContainerTypeRebateMappings = async (req, res) => {
  try {
    const { containerTypeId } = req.params;

    // Validate container type exists
    const containerType = await ContainerType.findById(containerTypeId);
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }

    const rebateMappings = await RestaurantContainerRebate.find({ 
      containerTypeId 
    })
    .populate('restaurantId', 'name')
    .populate('containerTypeId', 'name');

    res.status(200).json(rebateMappings);
  } catch (error) {
    console.error('Error retrieving container type rebate mappings:', error);
    res.status(500).json({ 
      message: 'Error retrieving rebate mappings', 
      details: error.message 
    });
  }
};

exports.getContainerTypeRebateValue = async (req, res) => {
  try {
    const { containerTypeId } = req.params;
    const restaurantId = req.user.restaurantId;

    // Find the specific rebate mapping for this container type and restaurant
    const rebateMapping = await RestaurantContainerRebate.findOne({
      restaurantId,
      containerTypeId
    });

    if (!rebateMapping) {
      return res.status(404).json({ 
        message: 'No specific rebate value found for this container type and restaurant',
        defaultRebateValue: containerType.rebateValue // fallback to default
      });
    }

    res.status(200).json({
      rebateValue: rebateMapping.rebateValue
    });
  } catch (error) {
    console.error('Error retrieving rebate value:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get all restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await mongoose.model('Restaurant').find({ isActive: true });
    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get containers for a specific restaurant
exports.getRestaurantContainers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // First check if the staff user belongs to this restaurant
    if (req.user.userType === 'staff' && req.user.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Unauthorized access to restaurant data' });
    }
    
    const containers = await Container.find({ restaurantId })
      .populate('containerTypeId')
      .populate('customerId', 'firstName lastName email')
      .sort({ updatedAt: -1 });
    
    res.json(containers);
  } catch (error) {
    console.error('Error getting restaurant containers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};