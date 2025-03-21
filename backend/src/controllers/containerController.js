const mongoose = require('mongoose');
const Container = require('../models/Container');
const ContainerType = require('../models/ContainerType');
const Rebate = require('../models/Rebate');
const Activity = require('../models/Activity');
const QRCode = require('qrcode');
const Restaurant = require('../models/Restaurant');

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

    res.json({
      availableContainers,
      activeContainers,
      returnedContainers
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

    // Get total rebate amount
    const rebates = await Rebate.find({ customerId });
    const totalRebate = rebates.reduce((total, rebate) => total + rebate.amount, 0);

    res.json({
      activeContainers,
      returnedContainers,
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
    const { containerId, amount, location } = req.body;
    const staffId = req.user._id;
    
    // Find the container
    const container = await Container.findById(containerId);
    
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    const customerId = container.customerId;
    
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
    container.status = 'returned';
    container.lastUsed = new Date();
    container.usesCount = (container.usesCount || 0) + 1;
    
    await container.save();
    
    // Record activity
    const newActivity = new Activity({
      userId: customerId,
      containerId,
      containerTypeId: container.containerTypeId,
      restaurantId: container.restaurantId,
      type: 'rebate',
      amount,
      location,
      notes: 'Rebate processed and container returned'
    });
    
    await newActivity.save();
    
    res.status(201).json(rebate);
  } catch (error) {
    console.error('Error processing rebate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate a QR code for a new container
exports.generateContainer = async (req, res) => {
  try {
    const { containerTypeId, restaurantId } = req.body;
    
    // Validate container type
    const containerType = await ContainerType.findById(containerTypeId);
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }
    
    // Validate restaurant if provided
    if (restaurantId) {
      const restaurant = await mongoose.model('Restaurant').findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
    }
    
    // Generate a unique QR code
    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrCode = `AQRO-${randomString}-${timestamp.slice(-6)}`;
    
    // Create a new container (NO customerId assigned)
    const container = new Container({
      qrCode,
      containerTypeId,
      restaurantId: restaurantId || null,
      status: 'available'  // Mark as 'available' for scanning later
    });
    
    await container.save();
    
    res.status(201).json({
      container,
      qrCode,
      qrCodeUrl: `/api/containers/qrcode/${container._id}`
    });
    
  } catch (error) {
    console.error('Error generating container:', error);
    res.status(500).json({ message: 'Server error' });
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