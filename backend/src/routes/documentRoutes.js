const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');
const documentController = require('../controllers/documentController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
    }
  }
}).fields([
  { name: 'businessPermit', maxCount: 1 },
  { name: 'birRegistration', maxCount: 1 }
]);

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(415).json({ message: err.message });
  }
  next();
};

// Admin routes - require admin authorization
router.post('/request-revision', protect, authorize('admin'), documentController.requestRevision);

// Staff routes - require staff authorization and needs_revision status
router.get('/staff/revision-details', protect, (req, res, next) => {
  if (req.user.userType === 'staff' && req.user.approvalStatus === 'needs_revision') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Only staff with revision status can access this route' });
  }
}, documentController.getRevisionDetails);

router.post('/staff/resubmit', protect, (req, res, next) => {
  if (req.user.userType === 'staff' && req.user.approvalStatus === 'needs_revision') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Only staff with revision status can access this route' });
  }
}, upload, handleMulterError, documentController.resubmitDocuments);

module.exports = router; 