const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Resend verification email
router.post('/resend-verification', authController.resendVerification);

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/register-staff', upload.fields([
  { name: 'businessPermit', maxCount: 1 },
  { name: 'birRegistration', maxCount: 1 },
  { name: 'restaurantLogo', maxCount: 1 }
]), authController.registerStaff);



module.exports = router;