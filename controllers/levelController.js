// controllers/levelController.js
const Level = require('../models/Level');
const UserProgress = require('../models/UserProgress');
const Course = require('../models/Course');

// @desc    Get all levels for a course
// @route   GET /api/levels/course/:courseId
// @access  Private
exports.getLevelsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get all levels for the course
    const levels = await Level.find({ course: courseId })
      .sort({ order: 1 });
    
    // Get user progress for these levels
    const userProgress = await UserProgress.find({
      user: req.user.id,
      course: courseId
    });
    
    // Map progress to levels
    const levelsWithProgress = levels.map(level => {
      const progress = userProgress.find(p => 
        p.level.toString() === level._id.toString()
      ) || { unlocked: false, completed: false, correctAnswers: 0, totalAnswers: 0 };
      
      return {
        ...level.toObject(),
        isUnlocked: progress.unlocked,
        isCompleted: progress.completed,
        correctAnswers: progress.correctAnswers,
        totalAnswers: progress.totalAnswers
      };
    });
    
    // For first level, ensure it's unlocked if no progress exists
    if (levelsWithProgress.length > 0 && !levelsWithProgress[0].isUnlocked) {
      // Create progress record for first level
      await UserProgress.create({
        user: req.user.id,
        course: courseId,
        level: levelsWithProgress[0]._id,
        unlocked: true
      });
      
      // Update in response
      levelsWithProgress[0].isUnlocked = true;
    }
    
    res.status(200).json({
      success: true,
      count: levelsWithProgress.length,
      data: levelsWithProgress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get level details
// @route   GET /api/levels/:id
// @access  Private
exports.getLevel = async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }
    
    // Get user progress for this level
    const progress = await UserProgress.findOne({
      user: req.user.id,
      level: level._id
    });
    
    const levelData = {
      ...level.toObject(),
      isUnlocked: progress ? progress.unlocked : false,
      isCompleted: progress ? progress.completed : false,
      correctAnswers: progress ? progress.correctAnswers : 0,
      totalAnswers: progress ? progress.totalAnswers : 0
    };
    
    res.status(200).json({
      success: true,
      data: levelData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create a new level
// @route   POST /api/levels
// @access  Private (Admin)
exports.createLevel = async (req, res) => {
  try {
    const { course, number, name, description, requiredPoints, unlockRequirements, order } = req.body;
    
    // Check if course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if level number already exists for this course
    const existingLevel = await Level.findOne({ course, number });
    if (existingLevel) {
      return res.status(400).json({
        success: false,
        message: `Level ${number} already exists for this course`
      });
    }
    
    // Check if order already exists for this course
    const existingOrder = await Level.findOne({ course, order });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: `A level with order ${order} already exists for this course`
      });
    }
    
    // Create level
    const level = await Level.create({
      course,
      number,
      name,
      description,
      requiredPoints,
      unlockRequirements,
      order
    });
    
    res.status(201).json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update a level
// @route   PUT /api/levels/:id
// @access  Private (Admin)
exports.updateLevel = async (req, res) => {
  try {
    const { name, description, requiredPoints, unlockRequirements, order } = req.body;
    
    // Find level
    let level = await Level.findById(req.params.id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }
    
    // Check if new order conflicts with existing
    if (order && order !== level.order) {
      const existingOrder = await Level.findOne({ 
        course: level.course, 
        order, 
        _id: { $ne: level._id } 
      });
      
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: `A level with order ${order} already exists for this course`
        });
      }
    }
    
    // Update fields
    level = await Level.findByIdAndUpdate(
      req.params.id,
      { name, description, requiredPoints, unlockRequirements, order },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};