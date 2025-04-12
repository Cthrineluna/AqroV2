const express = require('express');
const router = express.Router();
const containerTypeController = require('../controllers/containerTypeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `containerType-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter for multer (only allow images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
});

router.get('/', 
  protect,
  containerTypeController.getContainerTypes
);

// Get container type by ID
router.get('/:id', 
  protect,
  containerTypeController.getContainerTypeById
);

// Create new container type
router.post('/', 
  protect,
  authorize('admin'),
  upload.single('image'),
  containerTypeController.createContainerType
);

// Update container type
router.put('/:id', 
  protect,
  authorize('admin'),
  upload.single('image'),
  containerTypeController.updateContainerType
);

// Delete container type (soft delete)
router.delete('/:id', 
  protect,
  authorize('admin'),
  containerTypeController.deleteContainerType
);

// Hard delete container type (admin only)
router.delete('/hard/:id', 
  protect,
  authorize('admin'),
  containerTypeController.hardDeleteContainerType
);

module.exports = router;