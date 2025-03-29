const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected route - only for authenticated users
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

// Admin only route
router.get('/all', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;