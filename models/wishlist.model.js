const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tutors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Prevent duplicate wishlists for the same student
wishlistSchema.index({ student: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;