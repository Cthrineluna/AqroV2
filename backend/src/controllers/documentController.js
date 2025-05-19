const User = require('../models/Users');
const Restaurant = require('../models/Restaurant');
const { addDays } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');

exports.requestRevision = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set revision details
    user.approvalStatus = 'needs_revision';
    user.revisionRequestedAt = new Date();
    user.revisionReason = reason;
    user.revisionDeadline = addDays(new Date(), 14); // 2 weeks deadline

    await user.save();

    // TODO: Send email notification to user about revision request

    res.json({ message: 'Revision requested successfully' });
  } catch (error) {
    console.error('Error requesting revision:', error);
    res.status(500).json({ message: 'Failed to request revision' });
  }
};

exports.getRevisionDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting revision details for user:', userId);
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.approvalStatus !== 'needs_revision') {
      console.log('User does not need revision. Status:', user.approvalStatus);
      return res.status(400).json({ message: 'No revision requested' });
    }

    console.log('Revision details:', {
      revisionReason: user.revisionReason,
      revisionRequestedAt: user.revisionRequestedAt,
      revisionDeadline: user.revisionDeadline,
      documentsToRevise: user.documentsToRevise
    });

    res.json({
      revisionReason: user.revisionReason,
      revisionRequestedAt: user.revisionRequestedAt,
      revisionDeadline: user.revisionDeadline,
      documentsToRevise: user.documentsToRevise || []
    });
  } catch (error) {
    console.error('Error getting revision details:', error);
    res.status(500).json({ message: 'Failed to get revision details' });
  }
};

exports.resubmitDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.approvalStatus !== 'needs_revision') {
      return res.status(400).json({ message: 'No revision requested' });
    }

    if (new Date() > user.revisionDeadline) {
      return res.status(400).json({ message: 'Revision deadline has passed' });
    }

    // Handle file uploads
    const businessPermit = req.files?.businessPermit?.[0];
    const birRegistration = req.files?.birRegistration?.[0];

    if (!businessPermit && !birRegistration) {
      return res.status(400).json({ message: 'Please upload at least one document' });
    }

    // Update restaurant documents
    const restaurant = await Restaurant.findById(user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    try {
      // Read file contents
      if (businessPermit) {
        const fileData = await fs.readFile(businessPermit.path);
        restaurant.businessPermit = {
          fileData,
          fileName: businessPermit.originalname,
          mimeType: businessPermit.mimetype,
          uploadedAt: new Date()
        };
        // Delete the temporary file
        await fs.unlink(businessPermit.path);
      }

      if (birRegistration) {
        const fileData = await fs.readFile(birRegistration.path);
        restaurant.birRegistration = {
          fileData,
          fileName: birRegistration.originalname,
          mimeType: birRegistration.mimetype,
          uploadedAt: new Date()
        };
        // Delete the temporary file
        await fs.unlink(birRegistration.path);
      }

      await restaurant.save();

      // Reset user status to pending
      user.approvalStatus = 'pending';
      user.revisionRequestedAt = null;
      user.revisionReason = null;
      user.revisionDeadline = null;
      await user.save();

      res.json({ 
        message: 'Documents resubmitted successfully',
        documents: {
          businessPermit: businessPermit ? {
            fileName: businessPermit.originalname,
            mimeType: businessPermit.mimetype,
            uploadedAt: new Date()
          } : null,
          birRegistration: birRegistration ? {
            fileName: birRegistration.originalname,
            mimeType: birRegistration.mimetype,
            uploadedAt: new Date()
          } : null
        }
      });
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      // Clean up any uploaded files in case of error
      if (businessPermit) {
        try {
          await fs.unlink(businessPermit.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary business permit file:', unlinkError);
        }
      }
      if (birRegistration) {
        try {
          await fs.unlink(birRegistration.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary BIR registration file:', unlinkError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error resubmitting documents:', error);
    res.status(500).json({ 
      message: 'Failed to resubmit documents',
      error: error.message
    });
  }
}; 