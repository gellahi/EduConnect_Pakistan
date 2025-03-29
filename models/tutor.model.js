const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bio: {
        type: String,
        required: [true, 'Bio is required'],
        trim: true
    },
    education: [{
        degree: String,
        institution: String,
        year: Number
    }],
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    hourlyRate: {
        type: Number,
        required: [true, 'Hourly rate is required']
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: String,
        endTime: String
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: String,
        city: String
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verificationComment: String
}, {
    timestamps: true
});

// Index for geospatial queries
tutorSchema.index({ location: '2dsphere' });

const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;