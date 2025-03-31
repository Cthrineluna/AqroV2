const ContainerType = require('../models/ContainerType');

exports.getContainerTypes = async (req, res) => {
  try {
    const containerTypes = await ContainerType.find({ isActive: true });
    res.status(200).json(containerTypes);
  } catch (error) {
    console.error('Error fetching container types:', error);
    res.status(500).json({ message: 'Server error' });
  }
};