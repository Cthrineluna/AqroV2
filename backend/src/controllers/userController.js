const User = require('../models/Users');

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, password, profilePicture } = req.body;
      
      // Prepare update object
      const updateData = { 
        firstName, 
        lastName,
        profilePicture
      };
      
      // Only add email if it was provided and changed
      if (email && email !== req.user.email) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({ message: 'Email is already in use' });
        }
        updateData.email = email;
      }
      
      // Find user and update
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('-password');
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Handle password update separately if provided
      if (password && password.trim() !== '') {
        const user = await User.findById(userId);
        user.password = password;
        await user.save(); // This will trigger the password hash middleware
      }
  
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  exports.updateUserPassword = async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      user.password = newPassword;
      await user.save(); // This will trigger the password hash middleware
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Add these methods to your existing userController.js

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Exclude password field when fetching users and only get approved users
    const users = await User.find({ isApproved: true }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      userType: userType || 'customer'
    });

    await user.save();

    // Return user info without password
    res.status(201).json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error during user creation' });
  }
};

// Update user by admin
exports.updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, userType, password } = req.body;
    
    // Find the user first
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.userType = userType;

    // Handle email update with uniqueness check
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email;
    }

    // Handle password update if provided
    if (password && password.trim() !== '') {
      user.password = password; // This will be hashed by the pre-save hook
    }

    // Save the user (triggers password hashing)
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingStaff = async (req, res) => {
  try {
    const pendingStaff = await User.find({ 
      userType: 'staff',
      isActive: false,
      isEmailVerified: true 
    }).populate('restaurantId');
    
    res.json(pendingStaff);
  } catch (error) {
    console.error('Error fetching pending staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { comments } = req.body;

    // Activate user and their restaurant
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isActive: true,
        approvalComments: comments || null 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Activate the restaurant and set createdBy
    await Restaurant.findByIdAndUpdate(user.restaurantId, {
      isActive: true,
      createdBy: userId
    });

    // Send approval email
    await emailService.sendApprovalEmail(user);

    res.json({ 
      message: 'Staff member approved successfully',
      user 
    });
  } catch (error) {
    console.error('Error approving staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        rejectionReason: reason,
        isActive: false
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send rejection email
    await emailService.sendRejectionEmail(user, reason);

    res.json({ 
      message: 'Staff registration rejected',
      user 
    });
  } catch (error) {
    console.error('Error rejecting staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRestaurantStaff = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Find all staff users associated with this restaurant
    const staffMembers = await User.find({
      userType: 'staff',
      restaurantId: restaurantId
    }).select('-password');
    
    res.json(staffMembers);
  } catch (error) {
    console.error('Error fetching restaurant staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add this to userController.js


// Get available staff (users with staff type and no restaurant)
// Get available staff (users with staff type and no restaurant assigned)
exports.getAvailableStaff = async (req, res) => {
  try {
    const availableStaff = await User.find({
      userType: 'staff',
      $or: [
        { restaurantId: null },
        { restaurantId: { $exists: false } }
      ],
      isActive: true
    }).select('-password');
    
    res.status(200).json(availableStaff);
  } catch (error) {
    console.error('Error fetching available staff:', error);
    res.status(500).json({ message: 'Failed to fetch available staff' });
  }
};

// Assign restaurant to staff
exports.assignRestaurant = async (req, res) => {
  try {
    const { userId } = req.params;
    const { restaurantId } = req.body;
    
    if (!userId || !restaurantId) {
      return res.status(400).json({ message: 'User ID and Restaurant ID are required' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { restaurantId },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error assigning restaurant to user:', error);
    res.status(500).json({ message: 'Failed to assign restaurant to user' });
  }
};

// Remove restaurant from staff
exports.removeRestaurant = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $unset: { restaurantId: "" } },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error removing restaurant from user:', error);
    res.status(500).json({ message: 'Failed to remove restaurant from user' });
  }
};