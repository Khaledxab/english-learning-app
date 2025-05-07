// routes/levelRoutes.js
const express = require('express');
const { 
  getLevelsForCourse, 
  getLevel, 
  createLevel, 
  updateLevel 
} = require('../controllers/levelController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/course/:courseId', protect, getLevelsForCourse);
router.get('/:id', protect, getLevel);
router.post('/', protect, createLevel);
router.put('/:id', protect, updateLevel);

module.exports = router;