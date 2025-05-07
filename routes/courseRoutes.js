// Update routes/courseRoutes.js
const express = require('express');
const { 
  getCourses, 
  getCourse,
  createCourse 
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getCourses);
router.get('/:id', protect, getCourse);
router.post('/', protect, createCourse); // Add this new route

module.exports = router;