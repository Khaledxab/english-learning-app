const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide course name'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please provide course description']
  },
  level: {
    type: String,
    required: [true, 'Please provide course level'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with questions
CourseSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

module.exports = mongoose.model('Course', CourseSchema);