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