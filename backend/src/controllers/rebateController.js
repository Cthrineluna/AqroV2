const Rebate = require('../models/Rebate');

exports.getStaffRebateTotals = async (req, res) => {
  try {
    const { staffId, restaurantId } = req.params;

    // Aggregate total rebates for the staff at their restaurant
    const rebateTotals = await Rebate.aggregate([
      {
        $match: {
          staffId: mongoose.Types.ObjectId(staffId),
          // Optional: Add restaurant filtering if needed
          // You might need to join with Container or User model to get restaurant context
        }
      },
      {
        $group: {
          _id: null,
          totalRebateAmount: { $sum: '$amount' },
          rebateCount: { $sum: 1 }
        }
      }
    ]);

    // Return the total rebate amount and count
    if (rebateTotals.length > 0) {
      res.json({
        totalRebateAmount: rebateTotals[0].totalRebateAmount || 0,
        rebateCount: rebateTotals[0].rebateCount || 0
      });
    } else {
      res.json({
        totalRebateAmount: 0,
        rebateCount: 0
      });
    }
  } catch (error) {
    console.error('Error fetching staff rebate totals:', error);
    res.status(500).json({ message: 'Error fetching rebate totals', error: error.message });
  }
};

exports.getRestaurantRebateTotals = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Aggregate total rebates for the restaurant
    const rebateTotals = await Rebate.aggregate([
      {
        $lookup: {
          from: 'containers', // Assuming 'containers' is the collection name
          localField: 'containerId',
          foreignField: '_id',
          as: 'container'
        }
      },
      {
        $unwind: '$container'
      },
      {
        $match: {
          'container.restaurantId': mongoose.Types.ObjectId(restaurantId)
        }
      },
      {
        $group: {
          _id: null,
          totalRebateAmount: { $sum: '$amount' },
          rebateCount: { $sum: 1 }
        }
      }
    ]);

    // Return the total rebate amount and count
    if (rebateTotals.length > 0) {
      res.json({
        totalRebateAmount: rebateTotals[0].totalRebateAmount || 0,
        rebateCount: rebateTotals[0].rebateCount || 0
      });
    } else {
      res.json({
        totalRebateAmount: 0,
        rebateCount: 0
      });
    }
  } catch (error) {
    console.error('Error fetching restaurant rebate totals:', error);
    res.status(500).json({ message: 'Error fetching rebate totals', error: error.message });
  }
};