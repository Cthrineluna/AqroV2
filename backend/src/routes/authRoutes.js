const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Route to check auth status (protected)
router.get('/check', authMiddleware.protect, (req, res) => {
  res.status(200).json({ 
    message: 'Authenticated',
    user: {
      id: req.user.id,
      email: req.user.email,
      userType: req.user.userType,
      isEmailVerified: req.user.isEmailVerified
    }
  });
});

module.exports = router;