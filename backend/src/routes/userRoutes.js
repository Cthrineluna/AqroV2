const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

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

// Get all users
adminRouter.get('/', userController.getAllUsers);

// Create a new user
adminRouter.post('/', userController.createUser);

// Update a user
adminRouter.put('/:id', userController.updateUserByAdmin);

// Delete a user
adminRouter.delete('/:id', userController.deleteUser);

module.exports = {
  userRoutes: router,
  adminUserRoutes: adminRouter
};