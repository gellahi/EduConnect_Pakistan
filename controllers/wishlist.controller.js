const Wishlist = require('../models/wishlist.model');
const Tutor = require('../models/tutor.model');
const User = require('../models/user.model');

// Add tutor to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { tutorId } = req.body;

        // Check if tutor exists
        const tutorExists = await User.findOne({
            _id: tutorId,
            role: 'tutor'
        });

        if (!tutorExists) {
            return res.status(404).json({
                status: 'error',
                message: 'Tutor not found'
            });
        }

        // Find student's wishlist or create one
        let wishlist = await Wishlist.findOne({ student: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({
                student: req.user._id,
                tutors: [tutorId]
            });
        } else {
            // Check if tutor is already in wishlist
            if (wishlist.tutors.includes(tutorId)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Tutor is already in your wishlist'
                });
            }

            wishlist.tutors.push(tutorId);
        }

        await wishlist.save();

        res.status(200).json({
            status: 'success',
            data: { wishlist }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Remove tutor from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { tutorId } = req.params;

        // Find student's wishlist
        const wishlist = await Wishlist.findOne({ student: req.user._id });

        if (!wishlist) {
            return res.status(404).json({
                status: 'error',
                message: 'Wishlist not found'
            });
        }

        // Remove tutor from wishlist
        wishlist.tutors = wishlist.tutors.filter(
            tutor => tutor.toString() !== tutorId
        );

        await wishlist.save();

        res.status(200).json({
            status: 'success',
            data: { wishlist }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get student's wishlist
exports.getWishlist = async (req, res) => {
    try {
        // Find student's wishlist
        const wishlist = await Wishlist.findOne({ student: req.user._id })
            .populate({
                path: 'tutors',
                select: 'name email profilePicture',
                model: 'User'
            });

        if (!wishlist) {
            return res.status(200).json({
                status: 'success',
                data: { wishlist: { student: req.user._id, tutors: [] } }
            });
        }

        // Get additional tutor details
        const tutorsWithDetails = await Promise.all(
            wishlist.tutors.map(async (tutor) => {
                const tutorProfile = await Tutor.findOne({ user: tutor._id });
                return {
                    ...tutor.toObject(),
                    profile: tutorProfile
                };
            })
        );

        res.status(200).json({
            status: 'success',
            data: {
                wishlist: {
                    ...wishlist.toObject(),
                    tutors: tutorsWithDetails
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};