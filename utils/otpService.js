// utils/otpService.js
const crypto = require('crypto');
const User = require('../models/User');

// Store OTPs temporarily (in production, use Redis or another storage solution)
const otpStore = new Map();

/**
 * Generate a 6-digit OTP for the specified email
 * 
 * @param {string} email - User's email
 * @returns {string} - Generated OTP
 */
exports.generateOTP = (email) => {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with expiration (15 minutes)
  otpStore.set(email, {
    otp,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  
  console.log(`Generated OTP for ${email}: ${otp}`); // Remove in production
  
  return otp;
};

/**
 * Verify the OTP for the specified email
 * 
 * @param {string} email - User's email
 * @param {string} userOtp - OTP entered by user
 * @returns {Object} - Validation result
 */
exports.verifyOTP = (email, userOtp) => {
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > otpData.expires) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP expired' };
  }
  
  if (otpData.otp !== userOtp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP is valid, clean up
  otpStore.delete(email);
  return { valid: true };
};