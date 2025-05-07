// models/UserProgress.js
const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  unlocked: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  totalAnswers: {
    type: Number,
    default: 0
  },
  questionsPassed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Composite unique index to ensure one progress record per user per level per course
UserProgressSchema.index({ user: 1, course: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);