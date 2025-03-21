const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant'); // Import the Restaurant model

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/aqro', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Sample restaurant data
const restaurantData = [
  {
    name: "Green Bites",
    location: {
      address: "123 Eco Street",
      city: "Tuguegarao",
      coordinates: { lat: 17.6131, lng: 121.7269 }
    },
    description: "A sustainable restaurant serving organic meals.",
    contactNumber: "09123456789",
    logo: "green-bites.png",
    isActive: true
  },
  {
    name: "Zero Waste Cafe",
    location: {
      address: "456 Recycle Avenue",
      city: "Manila",
      coordinates: { lat: 14.5995, lng: 120.9842 }
    },
    description: "A zero-waste coffee shop with biodegradable cups.",
    contactNumber: "09234567890",
    logo: "zero-waste.png",
    isActive: true
  }
];

// Function to seed restaurants
const seedRestaurants = async () => {
  try {
    await Restaurant.deleteMany(); // Clears existing data
    const insertedRestaurants = await Restaurant.insertMany(restaurantData);
    console.log('Restaurants seeded successfully:', insertedRestaurants);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding restaurants:', error);
    mongoose.connection.close();
  }
};

// Run the seeder function
seedRestaurants();
