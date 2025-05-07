const Question = require('../models/Question');
const User = require('../models/User');
const Course = require('../models/Course'); // Add this line
const Achievement = require('../models/Achievement');
const { questionSelector } = require('../utils/questionSelector');
const { trackAchievements } = require('../utils/achievementTracker');
const config = require('../config/config');
const Level = require('../models/Level');
const UserProgress = require('../models/UserProgress');

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
    const question = await Question.findById(questionId).populate('level');
    
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
    const levelId = question.level._id;
    const courseId = question.course;
    
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
    
    // Update level progress
    let userProgress = await UserProgress.findOne({
      user: req.user.id,
      level: levelId
    });
    
    if (!userProgress) {
      userProgress = new UserProgress({
        user: req.user.id,
        course: courseId,
        level: levelId,
        unlocked: true,
        completed: false,
        correctAnswers: 0,
        totalAnswers: 0,
        questionsPassed: []
      });
    }
    
    userProgress.totalAnswers += 1;
    
    if (isCorrect) {
      userProgress.correctAnswers += 1;
      
      // Add to passed questions if not already there
      if (!userProgress.questionsPassed.includes(questionId)) {
        userProgress.questionsPassed.push(questionId);
      }
    }
    
    // Check if level is completed
    const totalQuestions = await Question.countDocuments({ level: levelId });
    const completionThreshold = Math.ceil(totalQuestions * 0.7); // 70% of questions
    
    if (userProgress.questionsPassed.length >= completionThreshold && !userProgress.completed) {
      userProgress.completed = true;
      
      // Unlock next level
      const currentLevel = await Level.findById(levelId);
      const nextLevel = await Level.findOne({
        course: currentLevel.course,
        order: currentLevel.order + 1
      });
      
      if (nextLevel) {
        // Create or update next level progress
        let nextLevelProgress = await UserProgress.findOne({
          user: req.user.id,
          level: nextLevel._id
        });
        
        if (!nextLevelProgress) {
          nextLevelProgress = new UserProgress({
            user: req.user.id,
            course: nextLevel.course,
            level: nextLevel._id,
            unlocked: true,
            completed: false,
            correctAnswers: 0,
            totalAnswers: 0,
            questionsPassed: []
          });
        } else {
          nextLevelProgress.unlocked = true;
        }
        
        await nextLevelProgress.save();
      }
    }
    
    await userProgress.save();
    
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
        levelProgress: {
          isCompleted: userProgress.completed,
          correctAnswers: userProgress.correctAnswers,
          totalAnswers: userProgress.totalAnswers,
          questionsCompleted: userProgress.questionsPassed.length,
          totalQuestions
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


exports.getQuestionsForLevel = async (req, res) => {
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
    
    // Check if user has unlocked this level
    const userProgress = await UserProgress.findOne({
      user: req.user.id,
      level: levelId
    });
    
    if (!userProgress || !userProgress.unlocked) {
      return res.status(403).json({ 
        success: false,
        message: 'This level is locked. Complete previous levels to unlock.' 
      });
    }
    
    // Get questions for this level
    const questions = await Question.find({ level: levelId });
    
    // Get questions passed by user
    const questionsPassed = userProgress.questionsPassed || [];
    
    // Sanitize questions (remove correct answers)
    const sanitizedQuestions = questions.map(question => {
      const isPassed = questionsPassed.includes(question._id);
      
      return {
        _id: question._id,
        text: question.text,
        type: question.type,
        difficultyRating: question.difficultyRating,
        options: question.options.map(option => ({
          _id: option._id,
          text: option.text
        })),
        isPassed
      };
    });
    
    res.status(200).json({
      success: true,
      count: sanitizedQuestions.length,
      data: sanitizedQuestions
    });
  } catch (error) {
    console.error('Error in getQuestionsForLevel:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// Add to controllers/questionController.js
// After updating user stats in submitAnswer function
// Check and update level progression
const updateLevelProgress = async (userId, question) => {
  try {
    // Find the question to get its level
    const fullQuestion = await Question.findById(question._id).populate('level');
    const levelId = fullQuestion.level._id;
    
    // Update user progress for this level
    let userProgress = await UserProgress.findOne({
      user: userId,
      level: levelId
    });
    
    if (!userProgress) {
      // Initialize progress if it doesn't exist
      userProgress = new UserProgress({
        user: userId,
        course: fullQuestion.level.course,
        level: levelId,
        unlocked: true, // Initial level starts unlocked
      });
    }
    
    // Update progress
    if (isCorrect) {
      userProgress.correctAnswers += 1;
      
      // Add to passed questions if not already there
      if (!userProgress.questionsPassed.includes(question._id)) {
        userProgress.questionsPassed.push(question._id);
      }
    }
    userProgress.totalAnswers += 1;
    userProgress.lastAccessed = Date.now();
    
    // Check if level is completed
    const levelQuestions = await Question.countDocuments({ level: levelId });
    const completionThreshold = Math.ceil(levelQuestions * 0.7); // 70% of questions
    
    if (userProgress.questionsPassed.length >= completionThreshold) {
      userProgress.completed = true;
      
      // Unlock next level
      const currentLevel = await Level.findById(levelId);
      const nextLevel = await Level.findOne({
        course: currentLevel.course,
        order: currentLevel.order + 1
      });
      
      if (nextLevel) {
        // Create or update next level progress
        let nextLevelProgress = await UserProgress.findOne({
          user: userId,
          level: nextLevel._id
        });
        
        if (!nextLevelProgress) {
          nextLevelProgress = new UserProgress({
            user: userId,
            course: nextLevel.course,
            level: nextLevel._id,
            unlocked: true
          });
        } else {
          nextLevelProgress.unlocked = true;
        }
        
        await nextLevelProgress.save();
      }
    }
    
    await userProgress.save();
    return userProgress;
  } catch (error) {
    console.error('Error updating level progress:', error);
    throw error;
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