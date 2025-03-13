const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/Users');
const Container = require('../models/Container');
const ContainerType = require('../models/ContainerType');
const Rebate = require('../models/Rebate');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aqro')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await ContainerType.deleteMany({});
    await Container.deleteMany({});
    await Rebate.deleteMany({});

    console.log('Previous data cleared');

    // Create a test customer
    const passwordHash = await bcrypt.hash('password123', 10);
    const testCustomer = await User.create({
      email: 'customer@example.com',
      password: passwordHash,
      firstName: 'Test',
      lastName: 'Customer',
      userType: 'customer',
      isActive: true
    });
    
    console.log('Test customer created');

    // Create container types
    const containerTypes = await ContainerType.insertMany([
      {
        name: 'Coffee Cup',
        description: 'Reusable coffee cup, 12oz',
        price: 12.99,
        image: 'coffee-cup.png',
        rebateValue: 1.50
      },
      {
        name: 'Lunch Box',
        description: 'Reusable lunch container, 32oz',
        price: 14.99,
        image: 'lunch-box.png',
        rebateValue: 2.00
      },
      {
        name: 'Water Bottle',
        description: 'Reusable water bottle, 24oz',
        price: 9.99,
        image: 'water-bottle.png',
        rebateValue: 1.00
      }
    ]);
    
    console.log('Container types created');

    // Generate QR codes (in a real app, you'd use a proper QR code generator)
    const generateQRCode = (prefix, id) => `${prefix}-${id}-${Date.now().toString().slice(-6)}`;

    // Create containers for the test customer
    const containers = [];
    
    // Active containers
    for (let i = 0; i < 3; i++) {
      containers.push({
        qrCode: generateQRCode('AQRO', i),
        customerId: testCustomer._id,
        status: 'active',
        containerTypeId: containerTypes[i % containerTypes.length]._id,
        purchaseDate: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
        registrationDate: new Date(Date.now() - (29 * 24 * 60 * 60 * 1000)), // 29 days ago
        lastUsed: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)), // 2 days ago
        usesCount: Math.floor(Math.random() * 10) + 1
      });
    }
    
    // Returned containers
    for (let i = 0; i < 2; i++) {
      containers.push({
        qrCode: generateQRCode('AQRO', i + 3),
        customerId: testCustomer._id,
        status: 'returned',
        containerTypeId: containerTypes[i % containerTypes.length]._id,
        purchaseDate: new Date(Date.now() - (45 * 24 * 60 * 60 * 1000)), // 45 days ago
        registrationDate: new Date(Date.now() - (44 * 24 * 60 * 60 * 1000)), // 44 days ago
        lastUsed: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)), // 15 days ago
        usesCount: Math.floor(Math.random() * 10) + 1
      });
    }
    
    const createdContainers = await Container.insertMany(containers);
    console.log('Containers created');

    // Create rebate history
    const rebates = [];
    
    // Create a staff member for rebate processing
    const staffMember = await User.create({
      email: 'staff@example.com',
      password: passwordHash,
      firstName: 'Test',
      lastName: 'Staff',
      userType: 'staff',
      isActive: true
    });
    
    console.log('Test staff created');

    // Generate rebates for each container
    for (const container of createdContainers) {
      const containerType = await ContainerType.findById(container.containerTypeId);
      
      // Create 1-3 rebates per container with different dates
      const rebateCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < rebateCount; i++) {
        rebates.push({
          containerId: container._id,
          customerId: testCustomer._id,
          staffId: staffMember._id,
          amount: containerType.rebateValue,
          date: new Date(Date.now() - (i * 5 * 24 * 60 * 60 * 1000)), // Spread out by 5 days
          location: 'Main Cafeteria'
        });
      }
    }
    
    await Rebate.insertMany(rebates);
    console.log('Rebates created');

    console.log('Seed completed successfully!');
    console.log('------------------------');
    console.log('Login credentials:');
    console.log('Customer: customer@example.com / password123');
    console.log('Staff: staff@example.com / password123');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Seeding error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();