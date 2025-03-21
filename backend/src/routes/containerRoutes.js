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

// Get all restaurants (admin only)
router.get('/restaurants', protect, authorize('admin'), containerController.getRestaurants);

// Get containers for a specific restaurant (staff and admin)
router.get('/restaurant/:restaurantId', protect, authorize('staff', 'admin'), containerController.getRestaurantContainers);

router.get('/restaurant/:restaurantId/stats', protect, authorize('staff', 'admin'), containerController.getRestaurantContainerStats);

// Generate new container (staff/admin only)
router.post(
    '/generate', 
    protect, 
    authorize('staff', 'admin'), 
    containerController.generateContainer
);

module.exports = router;