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

// Get all container types
router.get('/container-types', protect, containerController.getContainerTypes);

// Get QR code image
router.get('/qrcode/:id', containerController.getQRCodeImage);

// Get all restaurants 
router.get('/restaurants', protect, authorize('admin', 'staff'), containerController.getRestaurants);

// Get containers for a specific restaurant (staff and admin)
router.get('/restaurant/:restaurantId', protect, authorize('staff', 'admin'), containerController.getRestaurantContainers);

router.get('/restaurant/:restaurantId/stats', protect, authorize('staff', 'admin'), containerController.getRestaurantContainerStats);

// Get container details by QR code
router.get('/details', protect, containerController.getContainerDetailsByQR);

// Process rebate (staff/admin only)
router.post('/process-rebate', protect, authorize('staff', 'admin'), containerController.processRebate);

// Process container return (staff/admin only)
router.post('/process-return', protect, authorize('staff', 'admin'), containerController.processReturn);


// Generate new container (staff/admin only)
router.post(
    '/generate', 
    protect, 
    authorize('staff', 'admin'), 
    containerController.generateContainer
);

module.exports = router;