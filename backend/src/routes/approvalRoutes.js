// routes/approvalRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const approvalController = require('../controllers/approvalController');

// Admin approval routes
router.get('/admin/pending-staff', protect, authorize('admin'), approvalController.getPendingStaff);
router.post('/admin/approve-staff/:staffId', protect, authorize('admin'), approvalController.approveStaff);
router.post('/admin/reject-staff/:staffId', protect, authorize('admin'), approvalController.rejectStaff);

// Staff status check route
router.get('/staff/approval-status', protect, authorize('staff'), approvalController.checkApprovalStatus);

module.exports = router;