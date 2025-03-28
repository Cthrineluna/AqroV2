const mongoose = require('mongoose');

const restaurantContainerRebateSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  containerTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContainerType',
    required: true
  },
  rebateValue: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  // Ensure unique combination of restaurant and container type
  index: { 
    restaurantId: 1, 
    containerTypeId: 1, 
    unique: true 
  }
});

const RestaurantContainerRebate = mongoose.model('RestaurantContainerRebate', restaurantContainerRebateSchema);

module.exports = RestaurantContainerRebate;