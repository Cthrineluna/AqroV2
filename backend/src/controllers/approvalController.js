// controllers/approvalController.js
const User = require('../models/Users');
const Restaurant = require('../models/Restaurant');
const emailService = require('../services/emailService');

// Get pending staff approvals
exports.getPendingStaff = async (req, res) => {
    try {
      const pendingStaff = await User.find({ 
        userType: 'staff',
        isApproved: false,
        isEmailVerified: true 
      })
        .select('-password')
        .populate('restaurantId', 'name contactNumber');
      
      res.json(pendingStaff);
    } catch (error) {
      console.error('Error fetching pending staff:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  exports.approveStaff = async (req, res) => {
    try {
      const { staffId } = req.params;
      
      // Check if staffId is valid
      if (!staffId) {
        return res.status(400).json({ message: 'Staff ID is required' });
      }
      
      // Find user first to validate they exist before updating
      const userExists = await User.findById(staffId);
      if (!userExists) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get approver ID safely with fallback
      const approverId = req.user?.id || req.user?._id || null;
      
      // Approve user
      const user = await User.findByIdAndUpdate(
        staffId,
        { 
          isApproved: true,
          approvedAt: Date.now(),
          approvedBy: approverId,
          isActive: true
        },
        { new: true }
      );
  
      // Only update restaurant if the user has a valid restaurantId
      if (user.restaurantId) {
        try {
          await Restaurant.findByIdAndUpdate(user.restaurantId, {
            isActive: true,
            createdBy: user._id
          });
        } catch (restaurantError) {
          console.error('Error updating restaurant:', restaurantError);
          // Continue with approval even if restaurant update fails
        }
      }
  
      // Send approval notification with error handling
      try {
        await emailService.sendApprovalNotification(user);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Continue with approval even if email fails
      }
  
      res.json({ 
        message: 'Staff approved successfully',
        user: {
          id: user._id,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Error approving staff:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

// Reject staff member
exports.rejectStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      staffId,
      { 
        rejectionReason: reason,
        rejectedBy: req.user.id,
        rejectedAt: Date.now()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await emailService.sendRejectionEmail(user, reason);

    res.json({ message: 'Staff registration rejected', user });
  } catch (error) {
    console.error('Error rejecting staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check approval status (for staff)
exports.checkApprovalStatus = async (req, res) => {
  try {
    const staff = await User.findById(req.user.id)
      .select('isActive isEmailVerified rejectionReason')
      .populate('restaurantId', 'isActive name');
    
    if (!staff) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      isApproved: staff.isActive,
      isEmailVerified: staff.isEmailVerified,
      rejectionReason: staff.rejectionReason,
      restaurantStatus: staff.restaurantId?.isActive,
      restaurantName: staff.restaurantId?.name
    });
  } catch (error) {
    console.error('Error checking approval status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};