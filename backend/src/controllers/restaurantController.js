const Restaurant = require('../models/Restaurant');
const User = require('../models/Users');

// Get all restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true });
    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new restaurant

exports.createRestaurant = async (req, res) => {
  try {
    // Create the restaurant with the user ID who created it
    const newRestaurant = new Restaurant({
      ...req.body,
      createdBy: req.user.id
    });

    // Handle file uploads if they exist
    if (req.files) {
      // Handle logo
      if (req.files.logo && req.files.logo[0]) {
        const logoFile = req.files.logo[0];
        // Store just the filename path for the logo
        newRestaurant.logo = `/uploads/${Date.now()}-${logoFile.originalname}`;
        
        // Ensure uploads directory exists
        const dir = './public/uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write the file to disk
        fs.writeFileSync(`./public${newRestaurant.logo}`, logoFile.buffer);
      }
      if (req.files.banner && req.files.banner[0]) {
        const bannerFile = req.files.banner[0];
        newRestaurant.banner = `data:${bannerFile.mimetype};base64,${bannerFile.buffer.toString('base64')}`;
      }
      
      // Handle business permit
      if (req.files.businessPermit && req.files.businessPermit[0]) {
        const permitFile = req.files.businessPermit[0];
        newRestaurant.businessPermit = {
          fileName: permitFile.originalname,
          fileData: permitFile.buffer,
          mimeType: permitFile.mimetype,
          uploadedAt: new Date()
        };
      }
      
      // Handle BIR registration
      if (req.files.birRegistration && req.files.birRegistration[0]) {
        const birFile = req.files.birRegistration[0];
        newRestaurant.birRegistration = {
          fileName: birFile.originalname,
          fileData: birFile.buffer,
          mimeType: birFile.mimetype,
          uploadedAt: new Date()
        };
      }
    }

    const restaurant = await newRestaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const updateData = { ...req.body };
    
    // Handle file uploads if they exist
    if (req.files) {
      // Handle logo
      if (req.files.logo && req.files.logo[0]) {
        const logoFile = req.files.logo[0];
        // Store just the filename path for the logo
        updateData.logo = `/uploads/${Date.now()}-${logoFile.originalname}`;
        
        // Ensure uploads directory exists
        const dir = './public/uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write the file to disk
        fs.writeFileSync(`./public${updateData.logo}`, logoFile.buffer);
        
        // If there was an old logo, delete it
        const oldRestaurant = await Restaurant.findById(restaurantId);
        if (oldRestaurant?.logo && oldRestaurant.logo !== '' && fs.existsSync(`./public${oldRestaurant.logo}`)) {
          fs.unlinkSync(`./public${oldRestaurant.logo}`);
        }
      }
      
      
      // Handle business permit
      if (req.files.businessPermit && req.files.businessPermit[0]) {
        const permitFile = req.files.businessPermit[0];
        updateData.businessPermit = {
          fileName: permitFile.originalname,
          fileData: permitFile.buffer,
          mimeType: permitFile.mimetype,
          uploadedAt: new Date()
        };
      }
      
      if (req.files.banner && req.files.banner[0]) {
        const bannerFile = req.files.banner[0];
        updateData.banner = `data:${bannerFile.mimetype};base64,${bannerFile.buffer.toString('base64')}`;
      }
      
      // Handle BIR registration
      if (req.files.birRegistration && req.files.birRegistration[0]) {
        const birFile = req.files.birRegistration[0];
        updateData.birRegistration = {
          fileName: birFile.originalname,
          fileData: birFile.buffer,
          mimeType: birFile.mimetype,
          uploadedAt: new Date()
        };
      }
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get staff for a restaurant
exports.getRestaurantStaff = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    const staff = await User.find({
      userType: 'staff',
      restaurantId: restaurantId
    });
    
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error fetching restaurant staff:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant staff' });
  }
};