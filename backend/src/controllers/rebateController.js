const mongoose = require('mongoose');
const Rebate = require('../models/Rebate');
const RestaurantContainerRebate = require('../models/RestaurantContainerRebate');

// Get rebate values for a specific container type
// Get rebate values for a specific container type
exports.getRebatesByContainerType = async (req, res) => {
  try {
    const containerTypeId = req.params.containerTypeId;
    
    const rebates = await RestaurantContainerRebate.find({ containerTypeId })
      .populate({
        path: 'restaurantId',
        select: 'name',
        match: { _id: { $ne: null } } // Only populate if restaurant exists
      });
      
    const formattedRebates = rebates.map(rebate => {
      // Skip rebates with no restaurant or invalid restaurant reference
      if (!rebate.restaurantId) return null;
      
      return {
        restaurantId: rebate.restaurantId._id,
        restaurantName: rebate.restaurantId.name,
        rebateValue: rebate.rebateValue.toString(),
        _id: rebate._id
      };
    }).filter(rebate => rebate !== null); // Remove null entries
    
    res.status(200).json(formattedRebates);
  } catch (error) {
    console.error('Error fetching rebates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update rebate value
exports.createOrUpdateRebate = async (req, res) => {
  try {
    const { restaurantId, containerTypeId, rebateValue } = req.body;
    
    // Validate inputs
    if (!restaurantId || !containerTypeId || rebateValue === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if rebate already exists
    let rebate = await RestaurantContainerRebate.findOne({ 
      restaurantId, 
      containerTypeId 
    });
    
    if (rebate) {
      // Update existing rebate
      rebate.rebateValue = rebateValue;
      await rebate.save();
    } else {
      // Create new rebate
      rebate = new RestaurantContainerRebate({
        restaurantId,
        containerTypeId,
        rebateValue
      });
      await rebate.save();
    }
    
    res.status(200).json(rebate);
  } catch (error) {
    console.error('Error creating/updating rebate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete rebate
exports.deleteRebate = async (req, res) => {
  try {
    const { id } = req.params;
    
    await RestaurantContainerRebate.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Rebate deleted successfully' });
  } catch (error) {
    console.error('Error deleting rebate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

    // Aggregate total rebates for the specific restaurant
    const rebateTotals = await Rebate.aggregate([
      {
        $lookup: {
          from: 'users', // Assuming 'users' is the collection name for staff
          localField: 'staffId',
          foreignField: '_id',
          as: 'staffInfo'
        }
      },
      {
        $unwind: '$staffInfo'
      },
      {
        $match: {
          // Use new keyword with mongoose.Types.ObjectId
          'staffInfo.restaurantId': new mongoose.Types.ObjectId(restaurantId)
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
    res.status(500).json({ 
      message: 'Error fetching rebate totals', 
      error: error.message,
      stack: error.stack 
    });
  }
};