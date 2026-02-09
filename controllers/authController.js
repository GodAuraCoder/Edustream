const User = require('../models/User.js');
const jwt = require('jsonwebtoken');

// 1. Clerk Sync / Register Logic
exports.register = async (req, res) => {
  try {
    const { name, email, clerkId, role } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ clerkId });

    if (user) {
      // 🚨 THE FIX: If user exists but HAS NO ROLE, update it! 🚨
      if (!user.role || user.role === 'Pending Selection') {
         user.role = role;
         await user.save();
         console.log("✅ Role Updated for existing user:", email);
         return res.status(200).json({ message: "Role updated successfully", user });
      }

      // If they already have a real role (Student/Teacher), prevent changes
      return res.status(200).json({ 
        message: "User already synced.", 
        user 
      });
    }

    // 2. Create the new user
    user = new User({
      name,
      email,
      clerkId,
      role: role || 'student',
      // prevent "Password is required" validation errors since we use Clerk
      password: "CLERK_AUTH_USER_NO_PASSWORD" 
    });

    await user.save();
    console.log("✅ New User saved to MongoDB:", email);
    res.status(201).json({ message: "Welcome to EduStream! Role secured.", user });

  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. Login Logic
exports.login = async (req, res) => {
    try {
        const { clerkId } = req.body;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('enrolledCourses') 
            .populate('wishlist');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};