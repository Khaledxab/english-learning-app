const { validationResult } = require('express-validator');
const User = require('../models/User'); // Assuming your User model is here
const { sendOtp, verifyOtp } = require('../utils/otpService'); // Using your actual OTP service path

// Instead of saving the user immediately, store pending registrations in memory
// In production, you should use Redis or a database for this
const pendingRegistrations = {};

/**
 * Register a new user - Step 1: Store registration data and send OTP
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, username, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Store user data temporarily instead of saving to database
    pendingRegistrations[email] = {
      firstName,
      lastName,
      username,
      email,
      password,
      createdAt: new Date() // To track when this pending registration was created
    };

    // Set expiration for pending registration (e.g., 10 minutes)
    setTimeout(() => {
      delete pendingRegistrations[email];
    }, 10 * 60 * 1000);

    // Send OTP for verification
    try {
      await sendOtp(email);
      return res.status(200).json({
        message: 'Registration initiated. Please verify your email with the OTP sent.',
        email: email,
      });
    } catch (otpError) {
      delete pendingRegistrations[email];
      return res.status(500).json({ message: 'Failed to send OTP email.' });
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify OTP and complete user registration - Step 2
 */
exports.verifyRegistrationOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp } = req.body;

  try {
    // Check if this email has a pending registration
    if (!pendingRegistrations[email]) {
      return res.status(400).json({
        message: 'No pending registration found or registration attempt expired. Please register again.'
      });
    }

    // Verify OTP
    if (!verifyOtp(email, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
    }

    // If OTP verification is successful, create and save the user
    const userData = pendingRegistrations[email];
    const user = new User(userData);

    await user.save();

    // Clean up the pending registration
    delete pendingRegistrations[email];

    // Generate token or handle successful registration
    return res.status(201).json({
      message: 'Registration successful! Your account has been verified.',
      userId: user.id
    });

  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};





// @desc  Resend OTP for registration
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if there's a pending registration for this email
  if (!pendingRegistrations[email]) {
    return res.status(400).json({
      message: 'No pending registration found. Please register again.'
    });
  }

  try {
    await sendOtp(email);
    return res.status(200).json({
      message: 'OTP resent successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to resend OTP.'
    });
  }
};







// @desc  Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};