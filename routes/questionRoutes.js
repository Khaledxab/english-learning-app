// routes/questionRoutes.js
const express = require('express');
const { 
  getQuestionsForCourse, 
  getQuestionsForLevel,
  submitAnswer,
  createQuestion,
  createQuestionsBatch 
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Course = require('../models/Course');

const router = express.Router();

// Add the debug endpoint (no authentication required for debugging)
router.get('/debug', async (req, res) => {
  try {
    // 1. Get all courses
    const courses = await Course.find().lean();
    
    // 2. Get all questions 
    const questions = await Question.find().lean();
    
    // 3. Group questions by course
    const questionsByCourse = {};
    courses.forEach(course => {
      const courseId = course._id.toString();
      questionsByCourse[courseId] = {
        courseName: course.name,
        courseId: courseId,
        questions: questions.filter(q => 
          q.course && q.course.toString() === courseId
        )
      };
    });
    
    res.status(200).json({
      success: true,
      totalCourses: courses.length,
      totalQuestions: questions.length,
      coursesList: courses.map(c => ({
        id: c._id.toString(),
        name: c.name
      })),
      questionsByCourse
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// Your existing routes
router.get('/course/:courseId', protect, getQuestionsForCourse);
router.get('/level/:levelId', protect, getQuestionsForLevel); 

router.post('/:questionId/answer', protect, submitAnswer);


router.post('/', protect, createQuestion); 
router.post('/batch', protect, createQuestionsBatch); 


module.exports = router;