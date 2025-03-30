const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Protect all routes - only for admins
router.use(protect);
router.use(restrictTo('admin'));

// Tutor Verification Routes
router.get('/tutors/pending', adminController.getPendingTutors);
router.patch('/tutors/:id/verify', adminController.verifyTutor);

// Reporting Dashboard Routes
router.get('/reports/popular-subjects', adminController.getPopularSubjects);
router.get('/reports/session-stats', adminController.getSessionStats);
router.get('/reports/user-growth', adminController.getUserGrowth);
router.get('/reports/city-usage', adminController.getCityUsage);
router.get('/reports/export', adminController.exportData);

module.exports = router;