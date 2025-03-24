const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// all routes require authentication
router.use(authMiddleware.protect);

// get user profile
router.get('/profile', userController.getUserProfile);

// update user profile
router.put('/profile', userController.updateUserProfile);

//update user password
router.put('/password', userController.updateUserPassword);

module.exports = router;