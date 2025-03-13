const Container = require('../models/Container');
const ContainerType = require('../models/ContainerType');
const Rebate = require('../models/Rebate');

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
    const container = await Container.findOne({ qrCode });
    
    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }
    
    // Check if container is already registered to another user
    if (container.customerId && container.customerId.toString() !== customerId.toString()) {
      return res.status(400).json({ message: 'Container is already registered to another user' });
    }
    
    // Update container with new owner
    container.customerId = customerId;
    container.status = 'active';
    container.registrationDate = new Date();
    
    await container.save();
    
    res.json(container);
  } catch (error) {
    console.error('Error registering container:', error);
    res.status(500).json({ message: 'Server error' });
  }
};