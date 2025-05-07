// models/Level.js
const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  requiredPoints: {
    type: Number,
    default: 0
  },
  unlockRequirements: {
    previousLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level'
    },
    requiredCorrectAnswers: {
      type: Number,
      default: 0
    }
  },
  order: {
    type: Number,
    required: true
  }
});

// Ensure levels are unique per course
LevelSchema.index({ course: 1, number: 1 }, { unique: true });
LevelSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Level', LevelSchema);