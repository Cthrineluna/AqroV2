const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, return error
  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'User account has been deactivated' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Middleware to restrict access based on user type
exports.authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        message: `User type ${req.user.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

// In authMiddleware.js
exports.staffOnly = (req, res, next) => {
  if (req.user && (req.user.userType === 'staff' || req.user.userType === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Staff only' });
  }
};

exports.checkApproved = (req, res, next) => {
  if (req.user.userType === 'staff' && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your staff account is pending admin approval'
    });
  }
  next();
};

// Email verification check middleware
exports.checkVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first'
    });
  }
  next();
};