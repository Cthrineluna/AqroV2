const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const { protect } = require('../middleware/authMiddleware');

// Get container stats for logged in customer
router.get('/stats', protect, containerController.getContainerStats);

// Get all containers for logged in customer
router.get('/', protect, containerController.getCustomerContainers);

// Register a container to the logged in customer
router.post('/register', protect, containerController.registerContainer);

module.exports = router;