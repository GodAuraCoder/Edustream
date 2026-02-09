const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
// Add the curly braces { } around protect
const { protect } = require('../middleware/authMiddleware.js');

// This creates the link: /api/auth/register(For Registration)
router.post('/register', authController.register);
// This creates the link: /api/auth/login(For Login)
router.post('/login', authController.login);

// This tells Express: 1. Hit the route, 2. Run protect, 3. Run getProfile
router.get('/profile', protect, (req, res) => authController.getProfile(req, res));

module.exports = router;