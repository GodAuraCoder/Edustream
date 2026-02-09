// server/middleware/authMiddleware.js
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const User = require("../models/User");

const protect = ClerkExpressRequireAuth({});

const clerkMiddleware = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Attempt to find user
    let user = await User.findOne({ clerkId: req.auth.userId });

    // THE FIX: If no user exists, we attach ONLY the clerkId to req.user 
    // so the controller knows this is a brand new user that needs syncing.
    if (!user) {
      req.user = { id: req.auth.userId, isNewUser: true };
    } else {
      req.user = user;
      req.user.id = user.clerkId; // Ensure .id is always the Clerk string
    }

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error.message);
    res.status(500).json({ message: "Authentication failed" });
  }
};

const teacherOnly = (req, res, next) => {
  if (req.user && req.user.role === "teacher") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Teachers only" });
  }
};

module.exports = { protect, clerkMiddleware, teacherOnly };