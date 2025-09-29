const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');

// create product, optionally with image file (multer memory buffer)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    // prefer restaurantId from body, fall back to authenticated staff's restaurantId
    const restaurantId = req.body.restaurantId || (req.user && req.user.restaurantId ? req.user.restaurantId.toString() : undefined);
    const createdBy = req.user._id;

    // ensure staff can only create for their restaurant unless admin
    if (req.user.userType === 'staff') {
      const userRest = req.user.restaurantId ? req.user.restaurantId.toString() : undefined;
      // if restaurantId is provided and doesn't match user's restaurant, reject
      if (restaurantId && userRest && userRest !== restaurantId) {
        return res.status(403).json({ message: 'Unauthorized to create product for this restaurant' });
      }
    }

    const product = new Product({ name, description, price: Number(price) || 0, restaurantId, createdBy });

    // if file present, attach buffer and metadata
    if (req.file && req.file.buffer) {
      product.image = {
        fileData: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      };
    }

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    const products = await Product.find(filter).sort({ createdAt: -1 }).select('-image.fileData'); // avoid sending big buffers by default
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-image.fileData');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// endpoint to stream image buffer for product
exports.getProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('image');
    if (!product || !product.image || !product.image.fileData) return res.status(404).json({ message: 'Image not found' });
    res.set('Content-Type', product.image.mimeType || 'application/octet-stream');
    res.send(product.image.fileData);
  } catch (err) {
    console.error('Get product image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // ensure staff can only update their restaurant products
    if (req.user.userType === 'staff' && req.user.restaurantId && req.user.restaurantId.toString() !== product.restaurantId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this product' });
    }
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = typeof price !== 'undefined' ? price : product.price;

    if (req.file && req.file.buffer) {
      product.image = {
        fileData: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        uploadedAt: Date.now()
      };
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (req.user.userType === 'staff' && req.user.restaurantId && req.user.restaurantId.toString() !== product.restaurantId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this product' });
    }
    await product.remove();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rateProduct = async (req, res) => {
  try {
    const { rating } = req.body;
    const value = parseInt(rating, 10);
    if (!value || value < 1 || value > 5) return res.status(400).json({ message: 'Rating must be 1-5' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // replace existing rating by this user
    const existing = product.ratings.find(r => r.user.toString() === req.user._id.toString());
    if (existing) existing.value = value; else product.ratings.push({ user: req.user._id, value });
    product.recalculateRatings();
    await product.save();
    res.json({ message: 'Rating saved', product });
  } catch (err) {
    console.error('Rate product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// Note: previous duplicate deleteProduct/rateProduct definitions removed to avoid conflicts
