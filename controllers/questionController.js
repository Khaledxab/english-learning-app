const Question = require('../models/Question');
const User = require('../models/User');
const Course = require('../models/Course'); // Add this line
const Achievement = require('../models/Achievement');
const { questionSelector } = require('../utils/questionSelector');
const { trackAchievements } = require('../utils/achievementTracker');
const config = require('../config/config');

// @desc    Get questions for a course
// @route   GET /api/questions/course/:courseId
// @access  Private
// controllers/questionController.js - getQuestionsForCourse function
exports.getQuestionsForCourse = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const courseId = req.params.courseId;
    
    console.log('Request for questions from course:', courseId);
    console.log('User ID:', req.user.id);
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    console.log('Found course:', course.name);
    
    // Directly get questions from the database as a fallback test
    // This is just for debugging - we'll still use the selector below
    const directQuestions = await Question.find({ course: courseId.toString() });
    console.log(`Direct query found ${directQuestions.length} questions for course ${courseId}`);
    
    // Get 10 adaptive questions based on user's performance
    const questions = await questionSelector(user, courseId, 10);
    
    console.log(`Question selector returned ${questions.length} questions`);
    
    // Remove correct answers from response
    const sanitizedQuestions = questions.map(question => {
      return {
        _id: question._id,
        text: question.text,
        type: question.type,
        level: question.level,
        options: question.options.map(option => ({
          _id: option._id,
          text: option.text
        }))
      };
    });
    
    res.status(200).json({
      success: true,
      count: sanitizedQuestions.length,
      data: sanitizedQuestions
    });
  } catch (error) {
    console.error('Error in getQuestionsForCourse:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit answer for a question
// @route   POST /api/questions/:questionId/answer
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const { optionId } = req.body;
    const questionId = req.params.questionId;
    
    // Find the question
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if the answer is correct
    const selectedOption = question.options.id(optionId);
    
    if (!selectedOption) {
      return res.status(400).json({ message: 'Invalid option ID' });
    }
    
    const isCorrect = selectedOption.isCorrect;
    const questionType = question.type;
    
    // Update user stats
    const user = await User.findById(req.user.id);
    
    if (isCorrect) {
      user.points += config.points.correctAnswer;
      user.correctAnswers[questionType] += 1;
      user.consecutiveCorrectAnswers += 1;
    } else {
      user.points += config.points.wrongAnswer; // This will be negative
      user.wrongAnswers[questionType] += 1;
      user.consecutiveCorrectAnswers = 0;
    }
    
    // Ensure points don't go below zero
    if (user.points < 0) {
      user.points = 0;
    }
    
    await user.save();
    
    // Check and update achievements
    const achievements = await trackAchievements(user);
    
    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        explanation: question.explanation,
        userStats: {
          points: user.points,
          trophies: user.trophies,
          correctAnswers: user.correctAnswers,
          wrongAnswers: user.wrongAnswers
        },
        newAchievements: achievements
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// Add this to controllers/questionController.js

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private (Admin)
exports.createQuestion = async (req, res) => {
  try {
    const { text, type, level, options, explanation, courseId } = req.body;
    
    // Validate question type
    if (!['vocabulary', 'grammar'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Question type must be either vocabulary or grammar'
      });
    }
    
    // Validate level (1-100)
    if (level < 1 || level > 100) {
      return res.status(400).json({
        success: false,
        message: 'Question level must be between 1 and 100'
      });
    }
    
    // Validate options
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Questions must have at least 2 options'
      });
    }
    
    // Check if exactly one option is marked as correct
    const correctOptionsCount = options.filter(option => option.isCorrect).length;
    if (correctOptionsCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Questions must have exactly one correct option'
      });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Create new question
    const question = await Question.create({
      text,
      type,
      level,
      options,
      explanation,
      course: courseId
    });
    
    res.status(201).json({
      success: true,
      data: question
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

// @desc    Create multiple questions at once
// @route   POST /api/questions/batch
// @access  Private (Admin)
exports.createQuestionsBatch = async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of questions'
      });
    }
    
    const results = [];
    const errors = [];
    
    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const { text, type, level, options, explanation, courseId } = questions[i];
      
      try {
        // Validate question type
        if (!['vocabulary', 'grammar'].includes(type)) {
          errors.push({ index: i, message: 'Question type must be either vocabulary or grammar' });
          continue;
        }
        
        // Validate level (1-100)
        if (level < 1 || level > 100) {
          errors.push({ index: i, message: 'Question level must be between 1 and 100' });
          continue;
        }
        
        // Validate options
        if (!options || !Array.isArray(options) || options.length < 2) {
          errors.push({ index: i, message: 'Questions must have at least 2 options' });
          continue;
        }
        
        // Check if exactly one option is marked as correct
        const correctOptionsCount = options.filter(option => option.isCorrect).length;
        if (correctOptionsCount !== 1) {
          errors.push({ index: i, message: 'Questions must have exactly one correct option' });
          continue;
        }
        
        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
          errors.push({ index: i, message: 'Course not found' });
          continue;
        }
        
        // Create question
        const question = await Question.create({
          text,
          type,
          level,
          options,
          explanation,
          course: courseId
        });
        
        results.push(question);
      } catch (error) {
        errors.push({ index: i, message: error.message });
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        successCount: results.length,
        questions: results,
        errorCount: errors.length,
        errors
      }
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