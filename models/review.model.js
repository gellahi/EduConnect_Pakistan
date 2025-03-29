const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true
    }
}, {
    timestamps: true
});

// Prevent duplicate reviews
reviewSchema.index({ student: 1, session: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;