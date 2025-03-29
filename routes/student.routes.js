const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const tutorController = require('../controllers/tutor.controller');
const sessionController = require('../controllers/session.controller');
const reviewController = require('../controllers/review.controller');
const wishlistController = require('../controllers/wishlist.controller');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(restrictTo('student'));

// Tutor search & filtering routes
router.get('/tutors/search', tutorController.searchTutors);
router.get('/tutors/:id', tutorController.getTutorById);

// Session booking routes
router.post('/sessions/book', sessionController.bookSession);
router.get('/tutor-availability', sessionController.getTutorAvailability);

// Session management routes
router.get('/sessions', sessionController.getStudentSessions);
router.patch('/sessions/:id', sessionController.updateSessionStatus);

// Review routes
router.post('/reviews', reviewController.createReview);
router.get('/tutor-reviews/:tutorId', reviewController.getTutorReviews);

// Wishlist routes
router.post('/wishlist', wishlistController.addToWishlist);
router.delete('/wishlist/:tutorId', wishlistController.removeFromWishlist);
router.get('/wishlist', wishlistController.getWishlist);

module.exports = router;