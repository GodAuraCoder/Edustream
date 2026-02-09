const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, clerkMiddleware } = require('../middleware/authMiddleware');

// Dashboard Data
router.get('/dashboard-data', protect, clerkMiddleware, studentController.getDashboardData);

// Save Scratchpad Notes
router.post('/save-notes', protect, clerkMiddleware, studentController.saveNotes);

// ✅ Route for joining a new course
router.post('/enroll', protect, clerkMiddleware, studentController.enrollInCourse);

module.exports = router;