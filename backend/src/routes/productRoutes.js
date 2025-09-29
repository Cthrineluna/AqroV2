const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Public: list products (optionally filtered by restaurantId)
router.get('/', authMiddleware.protect, productController.getProducts);

// Public: get single product
router.get('/:id', authMiddleware.protect, productController.getProduct);

// Serve product image buffer
router.get('/:id/image', productController.getProductImage);

// Create product (staff or admin) - accept optional image file
router.post('/', authMiddleware.protect, authMiddleware.authorize('staff','admin'), upload.single('image'), productController.createProduct);

// Update product - accept optional image file
router.put('/:id', authMiddleware.protect, authMiddleware.authorize('staff','admin'), upload.single('image'), productController.updateProduct);

// Delete product
router.delete('/:id', authMiddleware.protect, authMiddleware.authorize('staff','admin'), productController.deleteProduct);

// Rate product (customers and others with accounts)
router.post('/:id/rate', authMiddleware.protect, productController.rateProduct);

module.exports = router;
