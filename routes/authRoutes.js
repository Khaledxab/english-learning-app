// routes/authRoutes.js
const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  verifyOTP, 
  resendOTP 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Register user
router.post('/register', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], register);

// Login user
router.post('/login', [
  check('username', 'Username is required').exists(),
  check('password', 'Password is required').exists()
], login);

// Verify OTP
router.post('/verify-otp', [
  check('email', 'Please include a valid email').isEmail(),
  check('otp', 'OTP is required').isLength({ min: 6, max: 6 })
], verifyOTP);

// Resend OTP
router.post('/resend-otp', [
  check('email', 'Please include a valid email').isEmail()
], resendOTP);

// Get current user
router.get('/me', protect, getMe);

module.exports = router;