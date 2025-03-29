const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Verify JWT token
exports.verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};