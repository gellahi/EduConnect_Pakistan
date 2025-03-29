const Review = require('../models/review.model');
const Session = require('../models/session.model');
const Tutor = require('../models/tutor.model');

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { sessionId, rating, comment } = req.body;

        // Check if session exists and is completed
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        if (session.status !== 'completed') {
            return res.status(400).json({
                status: 'error',
                message: 'You can only review completed sessions'
            });
        }

        // Check if user is the student who booked the session
        if (session.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only review sessions you have booked'
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            student: req.user._id,
            session: sessionId
        });

        if (existingReview) {
            return res.status(400).json({
                status: 'error',
                message: 'You have already reviewed this session'
            });
        }

        // Create new review
        const newReview = new Review({
            student: req.user._id,
            tutor: session.tutor,
            session: sessionId,
            rating,
            comment
        });

        await newReview.save();

        // Update tutor's average rating
        const tutor = await Tutor.findOne({ user: session.tutor });

        if (tutor) {
            // Calculate new average
            tutor.totalReviews += 1;
            const totalRatingPoints = (tutor.averageRating * (tutor.totalReviews - 1)) + rating;
            tutor.averageRating = totalRatingPoints / tutor.totalReviews;

            await tutor.save();
        }

        res.status(201).json({
            status: 'success',
            data: { review: newReview }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get reviews for a tutor
exports.getTutorReviews = async (req, res) => {
    try {
        const { tutorId } = req.params;

        const reviews = await Review.find({ tutor: tutorId })
            .populate({
                path: 'student',
                select: 'name profilePicture',
                model: 'User'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: { reviews }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};