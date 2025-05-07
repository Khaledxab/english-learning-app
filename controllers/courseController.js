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


// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Admin)
exports.createCourse = async (req, res) => {
  try {
    const { name, description, level } = req.body;
    
    // Validate that name is provided
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Course name is required'
      });
    }
    
    // Check if course already exists with the same name
    const existingCourse = await Course.findOne({ name });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'A course with this name already exists'
      });
    }
    
    // Validate level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: `Course level must be one of: ${validLevels.join(', ')}`
      });
    }
    
    // Create new course
    const course = await Course.create({
      name,
      description,
      level
    });
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};