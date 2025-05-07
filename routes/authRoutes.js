const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.post('/register', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], register);

router.post('/login', [
  check('username', 'Username is required').exists(),
  check('password', 'Password is required').exists()
], login);

router.get('/me', protect, getMe);

module.exports = router;