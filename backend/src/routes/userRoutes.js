const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// User profile routes (authenticated users)
router.use(authMiddleware.protect);

// get user profile
router.get('/profile', userController.getUserProfile);

// update user profile
router.put('/profile', userController.updateUserProfile);

//update user password
router.put('/password', userController.updateUserPassword);

// Admin user management routes
const adminRouter = express.Router();
adminRouter.use(authMiddleware.protect);
adminRouter.use(authMiddleware.authorize('admin'));

//get staff for restaurant
adminRouter.get('/restaurant/:restaurantId', userController.getRestaurantStaff);

// Get all users
adminRouter.get('/', userController.getAllUsers);

adminRouter.get('/available', userController.getAvailableStaff);
// Create a new user
adminRouter.post('/', userController.createUser);

// Update a user
adminRouter.put('/:id', userController.updateUserByAdmin);

// Delete a user
adminRouter.delete('/:id', userController.deleteUser);


router.get('/available-staff', protect, authorize('admin'), userController.getAvailableStaff);
router.put('/:userId/assign-restaurant', protect, authorize('admin'), userController.assignRestaurant);
router.put('/:userId/remove-restaurant', protect, authorize('admin'), userController.removeRestaurant);

adminRouter.put('/:userId/lock', userController.toggleUserLock);

module.exports = {
  userRoutes: router,
  adminUserRoutes: adminRouter
};