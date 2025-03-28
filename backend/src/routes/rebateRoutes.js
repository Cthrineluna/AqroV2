const express = require('express');
const router = express.Router();
const rebateController = require('../controllers/rebateController');
const authMiddleware = require('../middleware/authMiddleware');

// Get total rebates for a specific staff
router.get('/staff/:staffId/totals', 
  authMiddleware.protect, 
  rebateController.getStaffRebateTotals
);

// Get total rebates for a specific restaurant
router.get('/restaurant/:restaurantId/totals', 
  authMiddleware.protect, 
  rebateController.getRestaurantRebateTotals
);

module.exports = router;