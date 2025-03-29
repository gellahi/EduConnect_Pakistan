const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');

// Register new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phoneNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            role,
            phoneNumber
        });

        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser._id);

        // Remove password from response
        const user = newUser.toObject();
        delete user.password;

        res.status(201).json({
            status: 'success',
            token,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists and password is correct
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Remove password from response
        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            status: 'success',
            token,
            data: { user: userData }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};