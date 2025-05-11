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
// Modify in controllers/approvalController.js
exports.rejectStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { reason } = req.body;

    // First find the user to get their email and restaurant info
    const user = await User.findById(staffId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the restaurantId before deleting
    const restaurantId = user.restaurantId;
    
    // Store user email for sending rejection email
    const userEmail = user.email;
    const firstName = user.firstName;
    
    // Delete the restaurant if it exists
    if (restaurantId) {
      await Restaurant.findByIdAndDelete(restaurantId);
    }
    
    // Delete the user
    await User.findByIdAndDelete(staffId);

    // Send rejection email
    await emailService.sendRejectionEmail(
      { email: userEmail, firstName: firstName }, 
      reason
    );

    res.json({ 
      message: 'Staff registration rejected and account deleted',
      deletedUserId: staffId,
      deletedRestaurantId: restaurantId
    });
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

// Add this function to your approvalController.js
exports.getStaffDocuments = async (req, res) => {
  try {
    const { staffId, documentType } = req.params;
    
    // First get the user (staff) to find their associated restaurant
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user has a restaurantId
    if (!user.restaurantId) {
      return res.status(404).json({ success: false, message: 'No restaurant associated with this staff' });
    }
    
    // Log the restaurantId to debug
    console.log(`Finding restaurant with ID: ${user.restaurantId}`);
    
    // Get the restaurant document using the restaurantId from the user
    const restaurant = await Restaurant.findById(user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    console.log(`Found restaurant: ${restaurant.name}`);
    console.log(`Document type requested: ${documentType}`);
    
    // Get the requested document based on documentType
    let document;
    if (documentType === 'businessPermit') {
      document = restaurant.businessPermit;
      console.log(`Business permit exists: ${!!document?.fileData}`);
    } else if (documentType === 'birRegistration') {
      document = restaurant.birRegistration;
      console.log(`BIR registration exists: ${!!document?.fileData}`);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }
    
    if (!document || !document.fileData) {
      return res.status(404).json({ 
        success: false, 
        message: `Document not found. Please ensure the ${documentType} has been uploaded.` 
      });
    }
    
    // Convert the binary buffer to base64 string for frontend display
    const documentData = {
      fileName: document.fileName || 'document.pdf',
      mimeType: document.mimeType || 'application/pdf',
      uploadedAt: document.uploadedAt,
      fileData: document.fileData.toString('base64')
    };
    
    res.status(200).json(documentData);
  } catch (error) {
    console.error('Error fetching staff document:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while retrieving document',
      error: error.message
    });
  }
};