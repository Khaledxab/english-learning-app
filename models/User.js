const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Please provide username'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  points: {
    type: Number,
    default: 0
  },
  trophies: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    vocabulary: {
      type: Number,
      default: 0
    },
    grammar: {
      type: Number,
      default: 0
    }
  },
  wrongAnswers: {
    vocabulary: {
      type: Number,
      default: 0
    },
    grammar: {
      type: Number,
      default: 0
    }
  },
  consecutiveCorrectAnswers: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for total correct answers
UserSchema.virtual('totalCorrectAnswers').get(function() {
  return this.correctAnswers.vocabulary + this.correctAnswers.grammar;
});

// Virtual field for total wrong answers
UserSchema.virtual('totalWrongAnswers').get(function() {
  return this.wrongAnswers.vocabulary + this.wrongAnswers.grammar;
});

// Virtual field for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);