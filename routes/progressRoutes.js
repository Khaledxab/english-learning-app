// routes/progressRoutes.js
const express = require('express');
const { 
  getLevelProgress, 
  getLevelStatus, 
  resetLevelProgress 
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/level/:levelId', protect, getLevelProgress);
router.get('/level/:levelId/status', protect, getLevelStatus);
router.post('/level/:levelId/reset', protect, resetLevelProgress);

module.exports = router;