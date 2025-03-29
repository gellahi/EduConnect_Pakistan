const Session = require('../models/session.model');
const Tutor = require('../models/tutor.model');

// Get tutor's sessions
exports.getTutorSessions = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        let query = { tutor: req.user._id };

        // Filter by status if provided
        if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            query.status = status;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const sessions = await Session.find(query)
            .populate({
                path: 'student',
                select: 'name email profilePicture',
                model: 'User'
            })
            .populate('subject')
            .sort({ date: 1 });

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

// Update session status (accept, decline, complete)
exports.updateSessionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a valid status: confirmed, cancelled, or completed'
            });
        }

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        // Check if tutor owns this session
        if (session.tutor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to update this session'
            });
        }

        // Check if session can be updated
        if (session.status === 'completed') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot update a completed session'
            });
        }

        if (session.status === 'cancelled') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot update a cancelled session'
            });
        }

        // Update session status
        session.status = status;

        // If completing the session, update payment status
        if (status === 'completed') {
            session.paymentStatus = 'completed';
        }

        await session.save();

        res.status(200).json({
            status: 'success',
            data: { session }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get tutor's earnings
exports.getEarnings = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;

        let query = {
            tutor: req.user._id,
            status: 'completed',
            paymentStatus: 'completed'
        };

        let dateRange = {};
        const now = new Date();

        // Set date range based on period
        if (period === 'weekly') {
            // Last 7 days
            const lastWeek = new Date(now);
            lastWeek.setDate(lastWeek.getDate() - 7);
            dateRange = { $gte: lastWeek, $lte: now };
        } else if (period === 'monthly') {
            // Last 30 days
            const lastMonth = new Date(now);
            lastMonth.setDate(lastMonth.getDate() - 30);
            dateRange = { $gte: lastMonth, $lte: now };
        } else if (period === 'custom' && startDate && endDate) {
            // Custom date range
            dateRange = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // Add date range to query if specified
        if (Object.keys(dateRange).length > 0) {
            query.date = dateRange;
        }

        // Get completed sessions
        const sessions = await Session.find(query);

        // Calculate total earnings
        const totalEarnings = sessions.reduce((total, session) => total + session.price, 0);

        // Group sessions by day for chart data
        const earningsByDay = {};

        sessions.forEach(session => {
            const date = session.date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

            if (!earningsByDay[date]) {
                earningsByDay[date] = 0;
            }

            earningsByDay[date] += session.price;
        });

        // Convert to array format for easier rendering in the frontend
        const chartData = Object.keys(earningsByDay).map(date => ({
            date,
            earnings: earningsByDay[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            status: 'success',
            data: {
                totalEarnings,
                totalSessions: sessions.length,
                chartData
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};