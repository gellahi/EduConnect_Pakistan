const Tutor = require('../models/tutor.model');
const User = require('../models/user.model');
const Session = require('../models/session.model');
const Subject = require('../models/subject.model');
const Review = require('../models/review.model');

// Get all pending tutor verification requests
exports.getPendingTutors = async (req, res) => {
    try {
        const pendingTutors = await Tutor.find({ verificationStatus: 'pending' })
            .populate({
                path: 'user',
                select: 'name email phoneNumber profilePicture createdAt'
            })
            .populate('subjects');

        res.status(200).json({
            status: 'success',
            results: pendingTutors.length,
            data: { tutors: pendingTutors }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Verify or reject a tutor
exports.verifyTutor = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;

        // Validate status
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a valid status: approved or rejected'
            });
        }

        // Find tutor profile
        const tutor = await Tutor.findById(id);
        if (!tutor) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor profile not found'
            });
        }

        // Update verification status
        tutor.verificationStatus = status;

        // Add comment if provided
        if (comment) {
            tutor.verificationComment = comment;
        }

        await tutor.save();

        // Update user's isVerified status
        await User.findByIdAndUpdate(tutor.user, {
            isVerified: status === 'approved'
        });

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

// Get popular subjects with session counts
exports.getPopularSubjects = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter if provided
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
        }

        // Aggregate subjects by session count
        const pipeline = [
            {
                $match: startDate || endDate ? { date: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$subject',
                    sessionCount: { $sum: 1 },
                    completedCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                '$price',
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { sessionCount: -1 }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectData'
                }
            },
            {
                $project: {
                    subject: { $arrayElemAt: ['$subjectData', 0] },
                    sessionCount: 1,
                    completedCount: 1,
                    totalRevenue: 1
                }
            }
        ];

        const popularSubjects = await Session.aggregate(pipeline);

        res.status(200).json({
            status: 'success',
            data: { popularSubjects }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get session statistics
exports.getSessionStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter if provided
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
        }

        // Get session counts by status
        const statusCounts = await Session.aggregate([
            {
                $match: startDate || endDate ? { date: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate session completion rate
        let totalSessions = 0;
        let completedSessions = 0;

        statusCounts.forEach(stat => {
            totalSessions += stat.count;
            if (stat._id === 'completed') {
                completedSessions = stat.count;
            }
        });

        const completionRate = totalSessions > 0
            ? (completedSessions / totalSessions) * 100
            : 0;

        // Get sessions by day for chart data
        const sessionsPerDay = await Session.aggregate([
            {
                $match: startDate || endDate ? { date: dateFilter } : {}
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' }
                    },
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                '$price',
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                statusCounts,
                completionRate,
                sessionsPerDay,
                totalSessions,
                completedSessions
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get user growth statistics
exports.getUserGrowth = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter if provided
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
        }

        // Get total user counts by role
        const userCounts = await User.aggregate([
            {
                $match: startDate || endDate ? { createdAt: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get user signups by day
        const userGrowthByDay = await User.aggregate([
            {
                $match: startDate || endDate ? { createdAt: dateFilter } : {}
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        role: '$role'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ]);

        // Transform data for easier consumption
        const growthByDay = {};

        userGrowthByDay.forEach(item => {
            const { date, role } = item._id;

            if (!growthByDay[date]) {
                growthByDay[date] = {
                    student: 0,
                    tutor: 0,
                    admin: 0
                };
            }

            growthByDay[date][role] = item.count;
        });

        // Convert to array format for charts
        const dailyGrowthData = Object.keys(growthByDay).map(date => ({
            date,
            ...growthByDay[date]
        }));

        res.status(200).json({
            status: 'success',
            data: {
                userCounts,
                dailyGrowthData
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get city usage statistics
exports.getCityUsage = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter if provided
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
        }

        // Get most popular cities for tutors
        const tutorsByCity = await Tutor.aggregate([
            {
                $match: {
                    'location.city': { $exists: true, $ne: '' },
                    ...(startDate || endDate ? { createdAt: dateFilter } : {})
                }
            },
            {
                $group: {
                    _id: '$location.city',
                    tutorCount: { $sum: 1 }
                }
            },
            {
                $sort: { tutorCount: -1 }
            }
        ]);

        // Get most popular cities for sessions
        const sessionsByCity = await Session.aggregate([
            {
                $match: {
                    sessionType: 'in-person',
                    location: { $exists: true, $ne: '' },
                    ...(startDate || endDate ? { date: dateFilter } : {})
                }
            },
            {
                $group: {
                    _id: '$location',
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $sort: { sessionCount: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                tutorsByCity,
                sessionsByCity
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Export data in CSV or JSON format
exports.exportData = async (req, res) => {
    try {
        const { type, entity, startDate, endDate, format } = req.query;

        // Validate export parameters
        if (!type || !['sessions', 'users', 'tutors', 'reviews'].includes(type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a valid export type'
            });
        }

        if (!format || !['json', 'csv'].includes(format)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a valid export format: json or csv'
            });
        }

        // Build date filter if provided
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
        }

        let data;
        let fields = [];

        // Get data based on the requested type
        switch (type) {
            case 'sessions':
                data = await Session.find(
                    startDate || endDate ? { date: dateFilter } : {}
                )
                    .populate('student', 'name email')
                    .populate('tutor', 'name email')
                    .populate('subject', 'name category');

                fields = [
                    'id', 'student.name', 'student.email', 'tutor.name', 'tutor.email',
                    'subject.name', 'date', 'startTime', 'endTime', 'duration',
                    'sessionType', 'price', 'status', 'paymentStatus'
                ];
                break;

            case 'users':
                data = await User.find(
                    startDate || endDate ? { createdAt: dateFilter } : {}
                ).select('-password');

                fields = [
                    'id', 'name', 'email', 'role', 'phoneNumber', 'createdAt', 'isVerified'
                ];
                break;

            case 'tutors':
                data = await Tutor.find(
                    startDate || endDate ? { createdAt: dateFilter } : {}
                ).populate('user', 'name email phoneNumber')
                    .populate('subjects', 'name category');

                fields = [
                    'id', 'user.name', 'user.email', 'user.phoneNumber', 'bio',
                    'hourlyRate', 'location.city', 'averageRating', 'totalReviews',
                    'verificationStatus'
                ];
                break;

            case 'reviews':
                data = await Review.find(
                    startDate || endDate ? { createdAt: dateFilter } : {}
                ).populate('student', 'name')
                    .populate('tutor', 'name')
                    .populate('session');

                fields = [
                    'id', 'student.name', 'tutor.name', 'rating', 'comment', 'createdAt'
                ];
                break;
        }

        // Return data in the requested format
        if (format === 'json') {
            return res.status(200).json({
                status: 'success',
                data
            });
        } else if (format === 'csv') {
            // For actual CSV conversion, you'd use a library like json2csv
            // Placeholder response for now
            res.status(200).json({
                status: 'success',
                message: 'CSV export functionality would be implemented here with json2csv library',
                fields,
                dataCount: data.length
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};