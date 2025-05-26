// controllers/authController.js
const User = require('../models/User');
const { validationResult } = require('express-validator');
const otpService = require('../utils/otpService');
const emailService = require('../utils/emailService');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { firstName, lastName, username, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Check if username is taken
    user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Create user with verified = false
    user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      verified: false  // Mark as unverified until OTP confirmation
    });

    await user.save();

    // Generate OTP
    const otp = otpService.generateOTP(email);
    
    // Send OTP email
    await emailService.sendEmail(
      email,
      'Your OTP for Account Verification',
      `Your verification code is: ${otp}. This code expires in 15 minutes.`
    );

    // Don't send the token yet - user needs to verify email first
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email with the OTP sent.',
      email: email
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if the user has verified their email
    if (!user.verified) {
      // Generate a new OTP
      const otp = otpService.generateOTP(user.email);
      
      // Send OTP email
      await emailService.sendEmail(
        user.email,
        'Your OTP for Account Verification',
        `Your verification code is: ${otp}. This code expires in 15 minutes.`
      );
      
      return res.status(401).json({
        success: false,
        message: 'Please verify your email. We\'ve sent a new OTP.',
        requiresVerification: true,
        email: user.email
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }
  
  try {
    // Verify OTP
    const verification = otpService.verifyOTP(email, otp);
    
    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.message });
    }
    
    // Update user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { verified: true },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Now that the user is verified, send the JWT token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Generate new OTP
    const otp = otpService.generateOTP(email);
    
    // Send OTP email
    await emailService.sendEmail(
      email,
      'Your OTP for Account Verification (Resent)',
      `Your verification code is: ${otp}. This code expires in 15 minutes.`
    );
    
    res.status(200).json({
      success: true,
      message: 'OTP has been resent to your email'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
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