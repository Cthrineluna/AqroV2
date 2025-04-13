const ContainerType = require('../models/ContainerType');
const fs = require('fs');
const path = require('path');

exports.getContainerTypes = async (req, res) => {
  try {
    const containerTypes = await ContainerType.find({ isActive: true });
    res.status(200).json(containerTypes);
  } catch (error) {
    console.error('Error fetching container types:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getContainerTypeById = async (req, res) => {
  try {
    const containerType = await ContainerType.findById(req.params.id);
    
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }
    
    res.status(200).json(containerType);
  } catch (error) {
    console.error('Error fetching container type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new container type
exports.createContainerType = async (req, res) => {
  try {
    const { name, description, price, maxUses } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let image = 'default-container.png';
    
    // Handle image upload if provided
    if (req.file) {
      image = req.file.filename;
    }
    
    const containerType = new ContainerType({
      name,
      description,
      price,
      maxUses: maxUses || 10,
      image
    });
    
    await containerType.save();
    
    res.status(201).json(containerType);
  } catch (error) {
    console.error('Error creating container type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update container type
exports.updateContainerType = async (req, res) => {
  try {
    const { name, description, price, maxUses, isActive } = req.body;
    
    const containerType = await ContainerType.findById(req.params.id);
    
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }
    
    // Update fields if provided
    if (name) containerType.name = name;
    if (description !== undefined) containerType.description = description; 
    if (price) containerType.price = price;
    if (maxUses) containerType.maxUses = maxUses;
    if (isActive !== undefined) containerType.isActive = isActive;
    
    // Handle image upload if provided
    if (req.file) {
      // Delete old image if it's not the default
      if (containerType.image !== 'default-container.png') {
        const oldImagePath = path.join(__dirname, '../uploads', containerType.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      containerType.image = req.file.filename;
    }
    
    await containerType.save();
    
    res.status(200).json(containerType);
  } catch (error) {
    console.error('Error updating container type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete container type (soft delete by setting isActive to false)
exports.deleteContainerType = async (req, res) => {
  try {
    const containerType = await ContainerType.findById(req.params.id);
    
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }
    
    containerType.isActive = false;
    await containerType.save();
    
    res.status(200).json({ message: 'Container type deactivated successfully' });
  } catch (error) {
    console.error('Error deleting container type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Hard delete container type (for admin only)
exports.hardDeleteContainerType = async (req, res) => {
  try {
    const containerType = await ContainerType.findById(req.params.id);
    
    if (!containerType) {
      return res.status(404).json({ message: 'Container type not found' });
    }
    
    // Delete image if it's not the default
    if (containerType.image !== 'default-container.png') {
      const imagePath = path.join(__dirname, '../uploads', containerType.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await ContainerType.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Container type deleted permanently' });
  } catch (error) {
    console.error('Error hard deleting container type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};