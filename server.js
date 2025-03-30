const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config');
require('dotenv').config();

const app = express();

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const tutorRoutes = require('./routes/tutor.routes');
const adminRoutes = require('./routes/admin.routes'); // Add admin routes

app.get('/', (req, res) => {
    res.send('API is running...');
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/admin', adminRoutes); // Use admin routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));