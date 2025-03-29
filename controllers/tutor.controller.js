const Tutor = require('../models/tutor.model');

// Search for tutors with filters
exports.searchTutors = async (req, res) => {
    try {
        let query = {};
        const {
            subject,
            city,
            minPrice,
            maxPrice,
            minRating,
            day,
            startTime,
            endTime
        } = req.query;

        // Only include verified tutors
        query.verificationStatus = 'approved';

        // Filter by subject
        if (subject) {
            query.subjects = subject;
        }

        // Filter by city
        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.hourlyRate = {};
            if (minPrice) query.hourlyRate.$gte = Number(minPrice);
            if (maxPrice) query.hourlyRate.$lte = Number(maxPrice);
        }

        // Filter by rating
        if (minRating) {
            query.averageRating = { $gte: Number(minRating) };
        }

        // Filter by availability
        if (day) {
            query['availability.day'] = day;

            if (startTime || endTime) {
                if (startTime) {
                    query['availability.startTime'] = { $lte: startTime };
                }
                if (endTime) {
                    query['availability.endTime'] = { $gte: endTime };
                }
            }
        }

        // Find tutors matching the query
        const tutors = await Tutor.find(query)
            .populate({
                path: 'user',
                select: 'name email profilePicture'
            })
            .populate('subjects')
            .sort({ averageRating: -1 });

        res.status(200).json({
            status: 'success',
            results: tutors.length,
            data: { tutors }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get tutor details by ID
exports.getTutorById = async (req, res) => {
    try {
        const tutor = await Tutor.findById(req.params.id)
            .populate({
                path: 'user',
                select: 'name email profilePicture'
            })
            .populate('subjects');

        if (!tutor) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { tutor }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get tutor's own profile
exports.getTutorProfile = async (req, res) => {
    try {
        const tutorProfile = await Tutor.findOne({ user: req.user._id })
            .populate('subjects');

        if (!tutorProfile) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor profile not found. Please create your profile first.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                profile: tutorProfile,
                user: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create tutor profile
exports.createTutorProfile = async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await Tutor.findOne({ user: req.user._id });
        if (existingProfile) {
            return res.status(400).json({
                status: 'error',
                message: 'You already have a tutor profile. Please update your existing profile instead.'
            });
        }

        const {
            bio,
            education,
            hourlyRate,
            location,
            subjects
        } = req.body;

        // Validate required fields
        if (!bio || !hourlyRate || !location || !location.coordinates || !location.city) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields: bio, hourlyRate, location'
            });
        }

        // Create new tutor profile
        const newTutorProfile = new Tutor({
            user: req.user._id,
            bio,
            education: education || [],
            hourlyRate,
            location,
            subjects: subjects || [],
            availability: []
        });

        await newTutorProfile.save();

        res.status(201).json({
            status: 'success',
            data: { profile: newTutorProfile }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update tutor profile
exports.updateTutorProfile = async (req, res) => {
    try {
        const {
            bio,
            education,
            hourlyRate,
            location
        } = req.body;

        const tutorProfile = await Tutor.findOne({ user: req.user._id });

        if (!tutorProfile) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor profile not found. Please create your profile first.'
            });
        }

        // Update fields if provided
        if (bio) tutorProfile.bio = bio;
        if (education) tutorProfile.education = education;
        if (hourlyRate) tutorProfile.hourlyRate = hourlyRate;
        if (location) tutorProfile.location = location;

        await tutorProfile.save();

        res.status(200).json({
            status: 'success',
            data: { profile: tutorProfile }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update tutor availability
exports.updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;

        if (!availability || !Array.isArray(availability)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide availability as an array'
            });
        }

        // Validate each availability slot
        for (const slot of availability) {
            if (!slot.day || !slot.startTime || !slot.endTime) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Each availability slot must have day, startTime, and endTime'
                });
            }
        }

        const tutorProfile = await Tutor.findOne({ user: req.user._id });

        if (!tutorProfile) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor profile not found. Please create your profile first.'
            });
        }

        tutorProfile.availability = availability;
        await tutorProfile.save();

        res.status(200).json({
            status: 'success',
            data: {
                availability: tutorProfile.availability
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Add subjects to tutor profile
exports.addSubjects = async (req, res) => {
    try {
        const { subjects } = req.body;

        if (!subjects || !Array.isArray(subjects)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide subjects as an array of subject IDs'
            });
        }

        const tutorProfile = await Tutor.findOne({ user: req.user._id });

        if (!tutorProfile) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor profile not found. Please create your profile first.'
            });
        }

        // Verify all subjects exist
        for (const subjectId of subjects) {
            const subjectExists = await Subject.findById(subjectId);
            if (!subjectExists) {
                return res.status(404).json({
                    status: 'error',
                    message: `Subject with ID ${subjectId} not found`
                });
            }
        }

        // Add subjects if they are not already in the profile
        for (const subjectId of subjects) {
            if (!tutorProfile.subjects.includes(subjectId)) {
                tutorProfile.subjects.push(subjectId);
            }
        }

        await tutorProfile.save();

        // Populate subjects for response
        await tutorProfile.populate('subjects');

        res.status(200).json({
            status: 'success',
            data: {
                subjects: tutorProfile.subjects
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Remove subject from tutor profile
exports.removeSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const tutorProfile = await Tutor.findOne({ user: req.user._id });

        if (!tutorProfile) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor profile not found. Please create your profile first.'
            });
        }

        // Remove subject if it exists in the profile
        tutorProfile.subjects = tutorProfile.subjects.filter(
            subject => subject.toString() !== subjectId
        );

        await tutorProfile.save();

        // Populate subjects for response
        await tutorProfile.populate('subjects');

        res.status(200).json({
            status: 'success',
            data: {
                subjects: tutorProfile.subjects
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};