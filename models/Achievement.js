const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['trophy', 'point_milestone']
  },
  description: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', AchievementSchema);