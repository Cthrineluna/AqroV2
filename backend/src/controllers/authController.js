const User = require('../models/Users');
const Restaurant = require('../models/Restaurant');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const RestaurantContainerRebate = require('../models/RestaurantContainerRebate');
const ContainerType = require('../models/ContainerType');

//added
// 🔑 Strong password helper function
function isStrongPassword(password) {
  // Must include at least 1 lowercase, 1 uppercase, 1 digit, 1 special char, min 8 chars
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return strongPasswordRegex.test(password);
}
//added

const calculateLockoutDuration = (attempts) => {
  // Progressive lockout durations in milliseconds
  const durations = {
    1: 1 * 60 * 1000,     // 1 minute
    2: 3 * 60 * 1000,     // 3 minutes
    3: 5 * 60 * 1000,     // 5 minutes
    4: 10 * 60 * 1000,    // 10 minutes
    5: 15 * 60 * 1000,    // 15 minutes
    6: 30 * 60 * 1000,    // 30 minutes
    7: 60 * 60 * 1000,    // 1 hour
    8: 3 * 60 * 60 * 1000, // 3 hours
    9: 12 * 60 * 60 * 1000, // 12 hours
    10: 24 * 60 * 60 * 1000 // 24 hours
  };

  // Cap at 10 attempts, start at third attempt (index 1)
  const attemptCount = Math.min(attempts, 10);
  
  // Return appropriate duration
  return durations[attemptCount] || durations[10]; // Default to 24 hours if beyond defined thresholds
};

// Format lockout duration for user-friendly messages
const formatLockoutTime = (lockDuration) => {
  const lockoutMins = lockDuration / (60 * 1000);
  
  if (lockoutMins < 60) {
    return `${lockoutMins} minute${lockoutMins > 1 ? 's' : ''}`;
  } else {
    const lockoutHours = lockoutMins / 60;
    if (lockoutHours < 24) {
      return `${lockoutHours} hour${lockoutHours > 1 ? 's' : ''}`;
    } else {
      return `${lockoutHours / 24} day${lockoutHours >= 48 ? 's' : ''}`;
    }
  }
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      isApproved: user.userType === 'staff' ? user.isApproved : true,
      approvalStatus: user.approvalStatus || 'pending'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security reasons
      return res.status(200).json({ message: 'If your email is registered, you will receive reset instructions' });
    }
    
    // Generate random 6-digit token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set token in user document with expiration
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send email with reset token
    await emailService.sendPasswordResetEmail(user, resetToken);
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    //added
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long'
      });
    }
    //added
    
    // Find user by email and check token validity
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }
    
    // Update password and reset account lock
    user.password = newPassword; // Will be hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = null;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

exports.register = async (req, res) => {
  try {                                                     
    const { email, password, firstName, lastName, userType} = req.body;

    //added
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long'
      });
    }
    //added

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create new user with verification token
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      // phoneNumber, //added
      userType: userType || 'customer',
      verificationToken,
      verificationTokenExpires: Date.now() + 3600000, // 1 hour
      isEmailVerified: false
    });

    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);

    // Don't generate token yet, just return user info
    res.status(201).json({
      message: 'Registration successful! Please verify your email to continue.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;
    
    const user = await User.findOne({ 
      email, 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification token' 
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    // For staff, set approval requested timestamp
    if (user.userType === 'staff') {
      user.approvalRequestedAt = new Date();
    }

    await user.save();

    // Generate token with updated claims
    const authToken = this.generateToken(user);

    // Different responses based on user type
    if (user.userType === 'staff') {
      return res.status(200).json({
        success: true,
        token: authToken,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          isEmailVerified: true,
          isApproved: false,
          needsApproval: true
        },
        message: 'Email verified. Your staff account is pending admin approval.'
      });
    } else {
      // Regular users get full access immediately
      return res.status(200).json({
        success: true,
        token: authToken,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          isEmailVerified: true,
          isApproved: true,
          needsApproval: false
        },
        message: 'Email verified successfully!'
      });
    }

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during email verification' 
    });
  }
};

// Helper function to generate JWT
exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      isApproved: user.userType === 'staff' ? user.isApproved : true
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user with matching email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);
    
    return res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Server error during resend verification' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked
    const isLocked = user.lockUntil && user.lockUntil > Date.now();
    if (isLocked) {
      return res.status(403).json({ 
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later or reset your password.',
        accountLocked: true,
        email: user.email
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please verify your email before logging in.',
        needsVerification: true,
        email: user.email
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      // Start progressive lockout after 3 failed attempts
      if (user.loginAttempts >= 5) {
        const lockDuration = calculateLockoutDuration(user.loginAttempts - 4);
        user.lockUntil = Date.now() + lockDuration;
        const lockoutTimeMessage = formatLockoutTime(lockDuration);
        
        await user.save();
        
        return res.status(403).json({ 
          message: `Too many failed login attempts. Your account has been temporarily locked for ${lockoutTimeMessage}. Please try resetting your password.`,
          accountLocked: true,
          email: user.email,
          lockDuration: lockDuration
        });
      }
      
      await user.save();
      const warningThreshold = 4;
      
      if (user.loginAttempts >= warningThreshold) {
        return res.status(400).json({ 
          message: `Invalid email or password. ${5 - user.loginAttempts} attempt${5 - user.loginAttempts !== 1 ? 's' : ''} remaining before lockout.`,
          attemptsRemaining: 5 - user.loginAttempts
        });
      } else {
        return res.status(400).json({ 
          message: 'Invalid email or password.',
          attemptsRemaining: 5 - user.loginAttempts
        });
      }
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // For staff users, check approval status before isActive
    if (user.userType === 'staff') {
      if (user.approvalStatus === 'needs_revision') {
        // Generate token and return user info for revision
        const token = generateToken(user);
        return res.json({
          token,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            isEmailVerified: user.isEmailVerified,
            isApproved: false,
            approvalStatus: 'needs_revision'
          }
        });
      }
    }

    // Check if user is active (for non-staff or approved staff)
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Please contact support.' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved || false,
        approvalStatus: user.approvalStatus || 'pending'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.registerStaff = async (req, res, next) => {
  let restaurant;
  let user;

  try {
    // Validate required files
    if (!req.files || !req.files.businessPermit || !req.files.birRegistration) {
      return res.status(400).json({ message: 'Both business permit and BIR registration are required' });
    }

    // Destructure required fields
    const { 
      firstName, lastName, email, password,
      restaurantName, address, city, contactNumber, description,
      restaurantLogo // This will now be a base64 string instead of a file
    } = req.body;

    //added
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long'
      });
    }
    //added

    // Validate required fields
    const requiredFields = {
      firstName, lastName, email, password,
      restaurantName, address, city, contactNumber
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Process uploaded files
    const businessPermit = req.files.businessPermit[0];
    const birRegistration = req.files.birRegistration[0];
    
    // Create new restaurant (initially inactive)
    restaurant = new Restaurant({
      name: restaurantName,
      location: {
        address: address,
        city: city
      },
      description: description || '', 
      contactNumber,
      // Store base64 string directly if provided, otherwise use default
      logo: restaurantLogo || '',
      businessPermit: {
        fileData: businessPermit.buffer,
        fileName: businessPermit.originalname,
        mimeType: businessPermit.mimetype
      },
      birRegistration: {
        fileData: birRegistration.buffer,
        fileName: birRegistration.originalname,
        mimeType: birRegistration.mimetype
      },
      isActive: false
    });

    await restaurant.save();

    // Create rebate records for all container types
    const containerTypes = await ContainerType.find({ isActive: true });
    const rebatePromises = containerTypes.map(containerType => {
      return RestaurantContainerRebate.create({
        restaurantId: restaurant._id,
        containerTypeId: containerType._id,
        rebateValue: 1 // Default rebate value
      });
    });
    await Promise.all(rebatePromises);

    // Create staff user (initially inactive)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user = new User({
      firstName,
      lastName,
      email,
      password,
      userType: 'staff',
      restaurantId: restaurant._id,
      isActive: false,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpires: Date.now() + 3600000 // 1 hour
    });

    await user.save();

    // Update restaurant with creator reference
    restaurant.createdBy = user._id;
    await restaurant.save();

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);

    // Successful response
    return res.status(201).json({ 
      success: true,
      message: 'Registration successful! Please check your email for verification.',
      data: {
        userId: user._id,
        restaurantId: restaurant._id
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Cleanup any created documents if error occurred
    try {
      if (restaurant) {
        // Delete any created rebate records
        await RestaurantContainerRebate.deleteMany({ restaurantId: restaurant._id });
        // Delete the restaurant
        await Restaurant.deleteOne({ _id: restaurant._id });
      }
      if (user) await User.deleteOne({ _id: user._id });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Error response
    return res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};