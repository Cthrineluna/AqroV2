const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  containerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Container',
    required: true
  },
  containerTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContainerType',
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  type: {
    type: String,
    enum: ['registration', 'return', 'rebate', 'status_change'],
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  location: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});


activitySchema.index({ userId: 1, restaurantId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;