// controllers/progressController.js
const UserProgress = require('../models/UserProgress');
const Level = require('../models/Level');
const Question = require('../models/Question');

// @desc    Get user progress for a level
// @route   GET /api/progress/level/:levelId
// @access  Private
exports.getLevelProgress = async (req, res) => {
  try {
    const { levelId } = req.params;
    
    // Check if level exists
    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }
    
    // Get progress
    let progress = await UserProgress.findOne({
      user: req.user.id,
      level: levelId
    });
    
    // If no progress yet, create it
    if (!progress) {
      // Check if this is the first level
      const isFirstLevel = await Level.countDocuments({
        course: level.course,
        order: { $lt: level.order }
      }) === 0;
      
      progress = await UserProgress.create({
        user: req.user.id,
        course: level.course,
        level: levelId,
        unlocked: isFirstLevel, // First level is unlocked by default
        completed: false,
        correctAnswers: 0,
        totalAnswers: 0,
        questionsPassed: []
      });
    }
    
    res.status(200).json({
      success: true,
      data: progress
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

// @desc    Check level completion status
// @route   GET /api/progress/level/:levelId/status
// @access  Private
exports.getLevelStatus = async (req, res) => {
  try {
    const { levelId } = req.params;
    
    // Check if level exists
    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }
    
    // Get progress
    const progress = await UserProgress.findOne({
      user: req.user.id,
      level: levelId
    });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }
    
    // Get next level
    const nextLevel = await Level.findOne({
      course: level.course,
      order: level.order + 1
    });
    
    // Get next level progress if it exists
    let nextLevelProgress = null;
    if (nextLevel) {
      nextLevelProgress = await UserProgress.findOne({
        user: req.user.id,
        level: nextLevel._id
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        isUnlocked: progress.unlocked,
        isCompleted: progress.completed,
        correctAnswers: progress.correctAnswers,
        totalAnswers: progress.totalAnswers,
        questionsCompleted: progress.questionsPassed.length,
        nextLevel: nextLevel ? {
          _id: nextLevel._id,
          name: nextLevel.name,
          isUnlocked: nextLevelProgress ? nextLevelProgress.unlocked : false
        } : null
      }
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

// @desc    Reset level progress
// @route   POST /api/progress/level/:levelId/reset
// @access  Private
exports.resetLevelProgress = async (req, res) => {
  try {
    const { levelId } = req.params;
    
    // Check if level exists
    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }
    
    // Reset progress
    await UserProgress.findOneAndUpdate(
      { user: req.user.id, level: levelId },
      {
        completed: false,
        correctAnswers: 0,
        totalAnswers: 0,
        questionsPassed: []
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Level progress reset successfully'
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