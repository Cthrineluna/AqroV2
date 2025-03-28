const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const rebateController = require('../controllers/rebateController');

// Get total rebates for a specific staff
router.get('/staff/:staffId/totals', 
   protect, authorize('admin', 'staff'), 
  rebateController.getStaffRebateTotals
);

// Get total rebates for a specific restaurant
router.get('/restaurant/:restaurantId/totals', 
  protect,  // Ensure authentication middleware is applied
  authorize('admin', 'staff'),  // Ensure authorization
  rebateController.getRestaurantRebateTotals
);

module.exports = router;