const Container = require('../models/Container');
const ContainerType = require('../models/ContainerType');
const Rebate = require('../models/Rebate');
const QRCode = require('qrcode');

// Generate QR code image
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

// Generate a QR code for a new container
exports.generateContainer = async (req, res) => {
  try {
    const { containerTypeId } = req.body;
    
    // Validate container type
    const containerType = await ContainerType.findById(containerTypeId);
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }
    
    // Generate a unique QR code
    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrCode = `AQRO-${randomString}-${timestamp.slice(-6)}`;
    
    // Create a new container (NO customerId assigned)
    const container = new Container({
      qrCode,
      containerTypeId,
      status: 'available'  // 🔹 Mark as 'available' for scanning later
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
      const containerTypes = await ContainerType.find(); // Adjust based on your schema
      res.status(200).json(containerTypes);
    } catch (error) {
      console.error('Error fetching container types:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  