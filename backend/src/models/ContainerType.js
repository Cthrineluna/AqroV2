const mongoose = require('mongoose');

const containerTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
  },
  price: {
    type: Number,

  },
  image: {
    type: String,
    default: 'default-container.png'
  },
  rebateValue: {
    type: Number,
    default: 1
  },
  maxUses: {
    type: Number,
    required: true,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ContainerType = mongoose.model('ContainerType', containerTypeSchema);

module.exports = ContainerType;