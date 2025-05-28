const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateUsername,
  getUserAchievements
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get user profile
router.get('/profile', protect, getUserProfile);

// Update user profile with validation
router.put('/profile', [
  protect,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
], updateUserProfile);

// Change password with validation
router.put('/change-password', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], changePassword);

// Update username only
router.put('/update-username', [
  protect,
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
], updateUsername);

// Get user achievements
router.get('/achievements', protect, getUserAchievements);

module.exports = router;