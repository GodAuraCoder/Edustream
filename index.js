const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Import Routes
const courseRoutes = require('./routes/courseRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Initialize the app
dotenv.config();
const app = express();

// 1. THE SECURITY GATE (CORS): Updated for Vercel
app.use(cors({
    origin: [
        "http://localhost:5173", // For local testing
        "https://edustream-frontend-three.vercel.app" // Your live Vercel URL
    ],
    credentials: true
}));

app.use(express.json());

// 2. THE MAP: Organizing your API endpoints
app.get('/', (req, res) => {
    res.send("EduStream API is running...");
});

// Mounting routes correctly (no duplicates)
app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

// 3. THE CONNECTION: MongoDB Atlas cloud
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log("Database Connection Error:", err));

// 4. THE START: Port binding for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});