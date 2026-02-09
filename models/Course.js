const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    teacher: { 
        type: String, // Clerk ID (String)
        ref: 'User', 
        required: true
    },
    price: { 
        type: Number, 
        default: 0 
    },
    category: { 
        type: String, 
        default: 'Development' 
    },
    thumbnail: { 
        type: String,
        default: '' 
    },
    isPublished: { 
        type: Boolean, 
        default: false 
    },
    // Standardizing curriculum structure
    lessons: [{
        title: { type: String, required: true },
        videoUrl: { type: String, required: true },
        duration: { type: String },
        isFree: { type: Boolean, default: false }
    }],
    enrolledStudents: [{ 
        studentId: String, // Clerk ID
        amountPaid: { type: Number, default: 0 },
        enrollmentDate: { type: Date, default: Date.now },
        userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

// Ensures we can search by Clerk ID and MongoDB ID efficiently
CourseSchema.index({ teacher: 1 });

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;