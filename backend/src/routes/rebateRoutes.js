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

router.get('/:containerTypeId', 
  protect,
  rebateController.getRebatesByContainerType
);

// Create or update rebate
router.post('/', 
  protect,
  authorize('admin', 'staff'),
  rebateController.createOrUpdateRebate
);

// Delete rebate
router.delete('/:id', 
  protect,
  authorize('admin'),
  rebateController.deleteRebate
);

module.exports = router;