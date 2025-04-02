const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
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
      userType: userType || 'customer', // Default to customer if not specified
      isEmailVerified: false
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // We still create the user but inform them about the email issue
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified
      },
      message: 'Registration successful. Please verify your email address.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
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

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Please contact support.' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
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
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Email verification endpoint
exports.verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      email, 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendConfirmationEmail(user);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with verification even if confirmation email fails
    }

    // Generate new token with updated verification status
    const newToken = generateToken(user);

    res.json({
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified
      },
      message: 'Email verification successful'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verificationToken);
      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error during resend verification' });
  }
};