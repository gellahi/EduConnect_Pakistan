const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true,
        unique: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;