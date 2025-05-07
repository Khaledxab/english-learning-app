const express = require('express');
const { 
  getUserProfile, 
  updateUserProfile, 
  getUserAchievements 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/achievements', protect, getUserAchievements);

module.exports = router;
