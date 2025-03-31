const express = require('express');
const router = express.Router();
const containerTypeController = require('../controllers/containerTypeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', 
  protect,
  containerTypeController.getContainerTypes
);

module.exports = router;