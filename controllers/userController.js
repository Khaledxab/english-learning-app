const User = require('../models/User');
const Achievement = require('../models/Achievement');

const { validationResult } = require('express-validator');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user achievements
    const achievements = await Achievement.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        user,
        achievements
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { firstName, lastName, email, username } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if new username is already taken (if username is being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Check if new email is already taken (if email is being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName.trim();
    if (lastName !== undefined) updateFields.lastName = lastName.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (username !== undefined) updateFields.username = username.trim();

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Get user achievements
// @route   GET /api/users/achievements
// @access  Private
exports.getUserAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/courseController.js
const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  try {
    // Get user with password field (usually excluded by default)
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current password is correct
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (this will trigger the pre-save hook to hash the password)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Update username only
// @route   PUT /api/users/update-username
// @access  Private
exports.updateUsername = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Username is required'
    });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const trimmedUsername = username.trim();

    // Check if the new username is the same as current
    if (trimmedUsername === user.username) {
      return res.status(400).json({
        success: false,
        message: 'This is already your current username'
      });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Update username
    user.username = trimmedUsername;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      data: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update username error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
