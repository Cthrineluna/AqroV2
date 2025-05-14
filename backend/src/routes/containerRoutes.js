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

// Manage restaurant-specific rebate mappings (admin only)
router.post(
    '/rebate-mappings', 
    protect, 
    authorize('admin'), 
    containerController.manageRestaurantRebateMappings
  );
  
  // Get rebate mappings for a specific restaurant (staff and admin)
  router.get(
    '/rebate-mappings/:restaurantId', 
    protect, 
    authorize('staff', 'admin', 'customer'), 
    containerController.getRestaurantRebateMappings
  );

  // Get rebate mappings for a specific container type across all restaurants
router.get(
    '/rebate-mappings-by-container-type/:containerTypeId', 
    protect, 
    containerController.getContainerTypeRebateMappings
  );
  
  // This route is already defined in containerRoutes.js, so you might just need to update the controller method
router.get('/rebate-value/:containerTypeId', 
  protect, 
  authorize('staff', 'admin'), 
  containerController.getContainerTypeRebateValue
);

// Generate new container (staff/admin only)
router.post(
    '/generate', 
    protect, 
    authorize('staff', 'admin'), 
    containerController.generateContainer
);

// Get all containers (admin only)
router.get(
  '/all', 
  protect, 
  authorize('admin'), 
  containerController.getAllContainers
);


// Add this route
router.get('/users', protect, authorize('admin'), containerController.getUsers);

router.post(
  '/',
  protect,
  authorize('admin'),
  containerController.createContainer
);

// Update container (admin only)
router.put(
  '/:id',
  protect,
  authorize('admin'),
  containerController.updateContainer
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  containerController.deleteContainer
);

router.post(
  '/mark-status',
  protect,
  containerController.markContainerStatus
);
module.exports = router;