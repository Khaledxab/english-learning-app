const express = require('express');
const { register, login, getMe, verifyRegistrationOtp, resendOtp } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Registration with validation checks
router.post('/register', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], register);

// OTP Verification route
router.post('/verify-otp', [
  check('email', 'Please include a valid email').isEmail(),
  check('otp', 'OTP is required and must be 6 digits').isLength({ min: 6, max: 6 })
], verifyRegistrationOtp);


// Resend OTP route
router.post('/resend-otp', [
  check('email', 'Please include a valid email').isEmail()
], resendOtp);

// Login with validation checks
router.post('/login', [
  check('username', 'Username is required').exists(),
  check('password', 'Password is required').exists()
], login);

// Protected route to get user info
router.get('/me', protect, getMe);

module.exports = router;
