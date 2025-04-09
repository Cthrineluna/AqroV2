const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const restaurantController = require('../controllers/restaurantController');


const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all active restaurants
router.get('/', protect, authorize('admin', 'staff', 'customer'), restaurantController.getRestaurants);

// Get a single restaurant by ID
router.get('/:restaurantId', protect, authorize('admin', 'staff'), restaurantController.getRestaurantById);

// Create new restaurant
router.post('/', protect, authorize('admin'), upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'birRegistration', maxCount: 1 }
  ]), restaurantController.createRestaurant);


// Delete restaurant
router.delete('/:restaurantId', protect, authorize('admin'), restaurantController.deleteRestaurant);

// Update restaurant
router.put('/:restaurantId', protect, authorize('admin'), upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'birRegistration', maxCount: 1 }
  ]), restaurantController.updateRestaurant);

module.exports = router;
