const mongoose = require('mongoose');

const containerSchema = new mongoose.Schema({
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  
  },
  status: {
    type: String,
    enum: ['available', 'active', 'returned', 'lost', 'damaged'], 
    default: 'available'
  },
  containerTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContainerType',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  registrationDate: {
    type: Date,
    default: null  
  },
  lastUsed: {
    type: Date,
    default: null
  },
  usesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Container = mongoose.model('Container', containerSchema);

module.exports = Container;
