const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please provide question type'],
    enum: ['vocabulary', 'grammar']
  },
  level: {
    type: Number,
    required: [true, 'Please provide question level'],
    min: 1,
    max: 100
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  }],
  explanation: {
    type: String,
    required: [true, 'Please provide explanation for correct answer']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure each question has only one correct answer
QuestionSchema.pre('save', function(next) {
  const correctOptionsCount = this.options.filter(option => option.isCorrect).length;
  
  if (correctOptionsCount !== 1) {
    const error = new Error('A question must have exactly one correct answer');
    return next(error);
  }
  
  next();
});

module.exports = mongoose.model('Question', QuestionSchema);