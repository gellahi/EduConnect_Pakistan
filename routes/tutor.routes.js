const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const tutorController = require('../controllers/tutor.controller');
const tutorSessionController = require('../controllers/tutorSession.controller');

const router = express.Router();

// Protect all routes - only for tutors
router.use(protect);
router.use(restrictTo('tutor'));

// Profile Management
router.get('/profile', tutorController.getTutorProfile);
router.post('/profile', tutorController.createTutorProfile);
router.patch('/profile', tutorController.updateTutorProfile);
router.post('/availability', tutorController.updateAvailability);
router.post('/subjects', tutorController.addSubjects);
router.delete('/subjects/:subjectId', tutorController.removeSubject);

// Session Management
router.get('/sessions', tutorSessionController.getTutorSessions);
router.patch('/sessions/:id/status', tutorSessionController.updateSessionStatus);
router.get('/earnings', tutorSessionController.getEarnings);

module.exports = router;