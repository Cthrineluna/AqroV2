const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  value: { type: Number, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, default: 0 },
  // store image as buffer + metadata to match Restaurant upload patterns
  image: {
    fileData: Buffer,
    fileName: String,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratings: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, value: Number }],
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// helper to recalculate average
productSchema.methods.recalculateRatings = function() {
  if (!this.ratings || this.ratings.length === 0) {
    this.ratingAverage = 0;
    this.ratingCount = 0;
    return;
  }

  const sum = this.ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
  this.ratingCount = this.ratings.length;
  this.ratingAverage = parseFloat((sum / this.ratingCount).toFixed(2));
};

module.exports = mongoose.model('Product', productSchema);
