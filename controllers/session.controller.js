const Session = require('../models/session.model');
const Tutor = require('../models/tutor.model');

// Book a new session
exports.bookSession = async (req, res) => {
    try {
        const {
            tutorId,
            subjectId,
            date,
            startTime,
            endTime,
            duration,
            sessionType,
            location,
            meetingLink,
            notes
        } = req.body;

        // Validate if the tutor exists and is verified
        const tutor = await Tutor.findOne({
            user: tutorId,
            verificationStatus: 'approved'
        });

        if (!tutor) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor not found or not verified'
            });
        }

        // Calculate session price
        const price = tutor.hourlyRate * (duration / 60);

        // Check for double booking
        const bookingDate = new Date(date);
        const existingSession = await Session.findOne({
            tutor: tutorId,
            date: {
                $gte: new Date(bookingDate.setHours(0, 0, 0)),
                $lt: new Date(bookingDate.setHours(23, 59, 59))
            },
            startTime: startTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingSession) {
            return res.status(400).json({
                status: 'error',
                message: 'Tutor is already booked for this time'
            });
        }

        // Create new session
        const newSession = new Session({
            student: req.user._id,
            tutor: tutorId,
            subject: subjectId,
            date,
            startTime,
            endTime,
            duration,
            sessionType,
            location: sessionType === 'in-person' ? location : undefined,
            meetingLink: sessionType === 'online' ? meetingLink : undefined,
            price,
            notes
        });

        await newSession.save();

        res.status(201).json({
            status: 'success',
            data: { session: newSession }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get tutor's availability
exports.getTutorAvailability = async (req, res) => {
    try {
        const { tutorId, date } = req.query;

        // Get tutor's general availability
        const tutor = await Tutor.findOne({ user: tutorId });

        if (!tutor) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor not found'
            });
        }

        // Get tutor's booked sessions for the selected date
        const bookingDate = new Date(date);
        const bookedSessions = await Session.find({
            tutor: tutorId,
            date: {
                $gte: new Date(bookingDate.setHours(0, 0, 0)),
                $lt: new Date(bookingDate.setHours(23, 59, 59))
            },
            status: { $in: ['pending', 'confirmed'] }
        }).select('startTime endTime');

        res.status(200).json({
            status: 'success',
            data: {
                availability: tutor.availability,
                bookedSessions
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get student's sessions (dashboard)
exports.getStudentSessions = async (req, res) => {
    try {
        const { status } = req.query;

        let query = { student: req.user._id };

        if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            query.status = status;
        }

        const sessions = await Session.find(query)
            .populate({
                path: 'tutor',
                select: 'name email profilePicture',
                model: 'User'
            })
            .populate('subject')
            .sort({ date: -1 });

        res.status(200).json({
            status: 'success',
            results: sessions.length,
            data: { sessions }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update session (cancel)
exports.updateSessionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        // Check if user owns this session
        if (session.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to update this session'
            });
        }

        // Validate status change
        if (session.status === 'completed') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot update a completed session'
            });
        }

        if (status === 'cancelled' && session.status !== 'cancelled') {
            // Logic for cancellation (e.g., check cancellation policy)
            session.status = 'cancelled';
            await session.save();

            return res.status(200).json({
                status: 'success',
                data: { session }
            });
        }

        return res.status(400).json({
            status: 'error',
            message: 'Invalid status update'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};