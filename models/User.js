const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // The Clerk ID string (e.g., 'user_2r...') is the primary identifier
  _id: { type: String, required: true }, 
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  scratchpad: { type: String, default: "" },
  profilePicture: { type: String, default: "https://avatar.iran.liara.run/public" },
  
  // Use ObjectId for referencing Course documents
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  
  progress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedLessons: [String] // Array of lesson IDs or titles
  }],

  // Keeping clerkId as a virtual or mirrored field is fine, 
  // but usually redundant if it's already the _id.
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true }); 

module.exports = mongoose.model('User', UserSchema);