const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
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
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    date: {
        type: Date,
        required: [true, 'Session date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required']
    },
    duration: {
        type: Number, // in minutes
        required: [true, 'Duration is required']
    },
    sessionType: {
        type: String,
        enum: ['in-person', 'online'],
        required: [true, 'Session type is required']
    },
    location: {
        type: String,
        required: function () {
            return this.sessionType === 'in-person';
        }
    },
    meetingLink: {
        type: String,
        required: function () {
            return this.sessionType === 'online';
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;