// models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: {
    type: String,
    default: '' 
  },
  contactNumber: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: 'default-restaurant.png'
  },
  businessPermit: {  // Changed from businessLicense
    fileData: Buffer,
    fileName: String,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  birRegistration: {  // New field
    fileData: Buffer,
    fileName: String,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);