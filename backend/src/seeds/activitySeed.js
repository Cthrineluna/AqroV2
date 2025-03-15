const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Container = require('../models/Container');
const dotenv = require('dotenv');

dotenv.config();

// Specify the user ID you want to create activities for
const userId = "67d2780b289a90628e212e99";

// Connect to MongoDB with improved error handling
async function connectDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aqro');
    console.log('MongoDB connected for seeding');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

async function seedActivities() {
  // First check if we can connect to the database
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }
  
  try {
    console.log(`Looking for containers owned by user: ${userId}`);
    
    // First, get some container IDs for this user
    const containers = await Container.find({ customerId: userId });
    
    console.log(`Found ${containers.length} containers for this user`);
    
    if (containers.length === 0) {
      console.log('No containers found for this user. You need to add containers first.');
      await mongoose.connection.close();
      console.log('Database connection closed.');
      process.exit(0);
      return;
    }
    
    // Log some container info to verify we have valid containers
    console.log('Container samples:', containers.slice(0, 2).map(c => ({
      id: c._id.toString(),
      type: c.containerTypeId
    })));
    
    // Delete existing activities for this user if needed
    console.log('Removing any existing activities for this user...');
    const deleteResult = await Activity.deleteMany({ userId });
    console.log(`Deleted ${deleteResult.deletedCount} existing activities`);
    
    // Create sample activity data
    const activities = [];
    const currentDate = new Date();
    console.log('Generating new activity data...');
    
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      
      // Registration activity (oldest)
      const registrationDate = new Date(currentDate);
      registrationDate.setDate(registrationDate.getDate() - (30 - i)); // Spread out over the past month
      
      activities.push({
        userId,
        containerId: container._id,
        containerTypeId: container.containerTypeId,
        type: 'registration',
        status: 'completed',
        location: 'Main Recycling Center',
        createdAt: registrationDate
      });
      
      // Some returns and rebates for some containers
      if (i % 2 === 0) { // Only for some containers
        const returnDate = new Date(registrationDate);
        returnDate.setDate(returnDate.getDate() + 7); // 7 days after registration
        
        activities.push({
          userId,
          containerId: container._id,
          containerTypeId: container.containerTypeId,
          type: 'return',
          status: 'completed',
          location: 'Drop-off Station A',
          createdAt: returnDate
        });
        
        const rebateDate = new Date(returnDate);
        rebateDate.setMinutes(returnDate.getMinutes() + 5); // 5 minutes after return
        
        activities.push({
          userId,
          containerId: container._id,
          containerTypeId: container.containerTypeId,
          type: 'rebate',
          amount: Math.floor(Math.random() * 50) / 10 + 1, // Random amount between 1.0 and 6.0
          status: 'completed',
          location: 'Drop-off Station A',
          createdAt: rebateDate
        });
      }
      
      // Add some status changes
      if (i % 3 === 0) {
        const statusDate = new Date(registrationDate);
        statusDate.setDate(statusDate.getDate() + 3); // 3 days after registration
        
        activities.push({
          userId,
          containerId: container._id,
          containerTypeId: container.containerTypeId,
          type: 'status_change',
          status: 'completed',
          notes: 'Container in transit',
          createdAt: statusDate
        });
      }
    }
    
    // Add a few more recent activities regardless of containers
    if (containers.length > 0) {
      const recentContainer = containers[0];
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      activities.push({
        userId,
        containerId: recentContainer._id,
        containerTypeId: recentContainer.containerTypeId,
        type: 'return',
        status: 'completed',
        location: 'Community Recycling Event',
        createdAt: yesterday,
        notes: 'Special Earth Day event'
      });
      
      const today = new Date(currentDate);
      activities.push({
        userId,
        containerId: recentContainer._id,
        containerTypeId: recentContainer.containerTypeId,
        type: 'rebate',
        amount: 5.50,
        status: 'completed',
        location: 'Community Recycling Event',
        createdAt: today
      });
    }
    
    console.log(`Prepared ${activities.length} activities for insertion`);
    
    // Insert all activities - show progress with a batch approach if there are many
    if (activities.length > 0) {
      console.log('Inserting activities into database...');
      const result = await Activity.insertMany(activities);
      console.log(`Successfully inserted ${result.length} activities for user ${userId}`);
    }
    
    // All done - close connection
    await mongoose.connection.close();
    console.log('Database connection closed. Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during activity seeding:');
    console.error(error.message);
    console.error(error.stack);
    
    // Always close the connection even on error
    try {
      await mongoose.connection.close();
      console.log('Database connection closed after error.');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
    
    process.exit(1);
  }
}

// Run the seeding function
seedActivities();