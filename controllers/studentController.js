const User = require('../models/User.js'); // To update the student's data
const Course = require('../models/Course.js'); // To find the course they want to join

/**
 * ✅ 1. SYNC SCRATCHPAD NOTES
 * Syncs the dashboard scratchpad content to the database.
 */
exports.saveNotes = async (req, res) => {
    try {
        const { notes } = req.body;
        // req.user.id comes from your clerkMiddleware
        const userId = req.user.id;

        // ✅ THE MAGIC FIX: Upsert (Update or Create)
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId }, // Search by the Clerk ID
            { 
                $set: { scratchpad: notes },
                // If creating fresh, we need a default name/email
                $setOnInsert: { 
                    name: "New Student", 
                    email: "student@edustream.com" 
                } 
            },
            { new: true, upsert: true } 
        );

        res.status(200).json({ 
            success: true, 
            message: "Notes synced to cloud!", 
            data: updatedUser.scratchpad 
        });
    } catch (error) {
        console.error("Sync Error:", error.message);
        res.status(500).json({ message: "Server error during sync" });
    }
};

/**
 * ✅ 2. ENROLL IN COURSE
 * Adds a course ID to the student's enrolledCourses list.
 */
exports.enrollInCourse = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const courseId = req.params.id;

        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ message: "You are already enrolled in this course!" });
        }

        user.enrolledCourses.push(courseId);
        await user.save();

        res.json({ message: "Enrollment successful! Check your dashboard." });
    } catch (err) {
        console.error("Enrollment Error:", err.message);
        res.status(500).json({ message: "Error enrolling in course" });
    }
};

/**
 * ✅ 3. TOGGLE WISHLIST
 * Adds or removes a course from the student's wishlist.
 */
exports.toggleWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const courseId = req.params.id;

        const index = user.wishlist.indexOf(courseId);
        if (index > -1) {
            user.wishlist.splice(index, 1);
            await user.save();
            return res.json({ message: "Removed from wishlist" });
        } else {
            user.wishlist.push(courseId);
            await user.save();
            return res.json({ message: "Added to wishlist" });
        }
    } catch (err) {
        console.error("Wishlist Error:", err.message);
        res.status(500).json({ message: "Wishlist error" });
    }
};

/**
 * ✅ 4. UPDATE PROGRESS
 * Marks a specific lesson as completed within a course.
 */
exports.updateProgress = async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;
        const user = await User.findById(req.user.id);

        let courseProgress = user.progress.find(p => p.courseId.toString() === courseId);

        if (!courseProgress) {
            user.progress.push({ courseId, completedLessons: [lessonId] });
        } else {
            if (!courseProgress.completedLessons.includes(lessonId)) {
                courseProgress.completedLessons.push(lessonId);
            }
        }

        await user.save();
        res.json({ 
            message: "Lesson marked as complete!", 
            currentProgress: user.progress 
        });
    } catch (err) {
        console.error("Progress Sync Error:", err.message);
        res.status(500).json({ message: "Error updating progress" });
    }
};

/**
 * ✅ 5. GET DASHBOARD DATA
 * Returns the populated enrollment list for the Recent Activity section.
 */
// File: server/controllers/studentController.js

exports.getDashboardData = async (req, res) => {
    try {
        // req.user.id is the Clerk ID string from your middleware
        const userId = req.user.id;

        // 1. Find the user and "populate" their course details
        let user = await User.findById(userId).populate('enrolledCourses');

        // 2. If the user is brand new to the DB, create their profile immediately
        if (!user) {
            user = await User.create({
                _id: userId,
                name: "New Learner",
                email: "student@edustream.com", // You can later grab real email from req.auth
                role: 'student'
            });
        }

        // 3. Send the clean data back to your React frontend
        res.status(200).json({
            success: true,
            enrolledCourses: user.enrolledCourses,
            scratchpad: user.scratchpad || "",
            role: user.role
        });
    } catch (error) {
        console.error("Dashboard Fetch Error:", error.message);
        res.status(500).json({ message: "Failed to load dashboard data" });
    }
};

exports.enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id; // Clerk ID from your working middleware

        // ✅ Add course to enrollment array if it's not already there
        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { enrolledCourses: courseId } },
            { new: true }
        ).populate('enrolledCourses');

        res.status(200).json({ 
            success: true, 
            message: "Enrolled successfully!", 
            enrolledCourses: user.enrolledCourses 
        });
    } catch (error) {
        res.status(500).json({ message: "Enrollment failed" });
    }
};