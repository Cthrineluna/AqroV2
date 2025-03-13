const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const { protect, authorize } = require('../middleware/authMiddleware');


// Get container stats for logged in customer
router.get('/stats', protect, containerController.getContainerStats);

// Get all containers for logged in customer
router.get('/', protect, containerController.getCustomerContainers);

// Register a container to the logged in customer
router.post('/register', protect, containerController.registerContainer);

router.get('/container-types', protect, containerController.getContainerTypes);

// Get QR code image
router.get('/qrcode/:id', containerController.getQRCodeImage);

// Generate new container (staff/admin only)
router.post(
    '/generate', 
    protect, 
    authorize('staff', 'admin'), 
    containerController.generateContainer
  );

module.exports = router;