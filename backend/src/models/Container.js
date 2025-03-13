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
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'lost', 'damaged'],
    default: 'active'
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
    default: Date.now
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