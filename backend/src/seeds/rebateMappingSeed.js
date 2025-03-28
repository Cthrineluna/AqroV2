const mongoose = require('mongoose');

// Ensure you replace these with your actual database connection string
const MONGODB_URI = 'mongodb://localhost:27017/aqro';

// Define the schema for RestaurantContainerRebate (example schema)
const RestaurantContainerRebateSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant' 
  },
  containerTypeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ContainerType' 
  },
  rebateValue: { 
    type: Number, 
    required: true 
  }
});

const RestaurantContainerRebate = mongoose.model('RestaurantContainerRebate', RestaurantContainerRebateSchema);

const createRebateMappings = async () => {
  try {
    // Connect to MongoDB (updated connection options)
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Rebate mappings (using mongoose.Types.ObjectId constructor)
    const rebateMappings = await RestaurantContainerRebate.create([
      {
        restaurantId: new mongoose.Types.ObjectId('67dd0825d0c96eba397890f1'), // Green Bites
        containerTypeId: new mongoose.Types.ObjectId('67d2772165f5546a9b04ca92'), // Coffee Cup
        rebateValue: 10
      },
      {
        restaurantId: new mongoose.Types.ObjectId('67dd0825d0c96eba397890f1'), // Green Bites
        containerTypeId: new mongoose.Types.ObjectId('67d2772165f5546a9b04ca93'), // Lunch Box
        rebateValue: 20
      },
      {
        restaurantId: new mongoose.Types.ObjectId('67dd0825d0c96eba397890f1'), // Green Bites
        containerTypeId: new mongoose.Types.ObjectId('67d2772165f5546a9b04ca94'), // Water Bottle
        rebateValue: 5
      },
      {
        restaurantId: new mongoose.Types.ObjectId('67dd0825d0c96eba397890f2'), // Zero Waste Cafe
        containerTypeId: new mongoose.Types.ObjectId('67d2772165f5546a9b04ca92'), // Coffee Cup
        rebateValue: 10
      },
      {
        restaurantId: new mongoose.Types.ObjectId('67dd0825d0c96eba397890f2'), // Zero Waste Cafe
        containerTypeId: new mongoose.Types.ObjectId('67d2772165f5546a9b04ca93'), // Lunch Box
        rebateValue: 20
      },
      {
        restaurantId: new mongoose.Types.ObjectId('67dd0825d0c96eba397890f2'), // Zero Waste Cafe
        containerTypeId: new mongoose.Types.ObjectId('67d2772165f5546a9b04ca94'), // Water Bottle
        rebateValue: 5
      }
    ]);

    console.log('Rebate mappings created successfully:', rebateMappings);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error creating rebate mappings:', error);
    
    // Ensure connection is closed even if there's an error
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Run the mapping creation
createRebateMappings();