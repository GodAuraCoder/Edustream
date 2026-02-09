const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const courseRoutes = require('./routes/courseRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const cors = require('cors');

// Initialize the app
dotenv.config();
const app = express();

// 1. THE TRANSLATOR: This lets the server read your course data (JSON)
app.use(cors()); // Enable CORS for all routes (you can configure this for specific origins in production)
app.use(express.json());
app.use('/api/student', studentRoutes); // This mounts the routes so the frontend can find them

// This "mounts" the routes so the frontend can find them
app.use('/api/user', authRoutes);

// 2. THE MAP: This connects the URLs to your professional folders
app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

// 3. TEST ROUTE: To check if the server is alive in your browser
app.get('/', (req, res) => {
    res.send("EduStream API is running...");
});

// 4. THE CONNECTION: Link to your MongoDB Atlas cloud
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log("Database Connection Error:", err));

// 5. THE START: Turn the server on
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
