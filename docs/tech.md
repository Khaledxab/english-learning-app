# English Learning App Backend - Technical Documentation

## Architecture Overview

### System Architecture
The English Learning App backend is built using a modern Node.js stack with the following components:

- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **API Style**: RESTful architecture
- **Validation**: express-validator

### Directory Structure
```
english-learning-app/
├── config/               # Configuration files
│   ├── db.js            # Database connection
│   └── config.js        # Application configuration
├── controllers/          # Request handlers
│   ├── authController.js
│   ├── courseController.js
│   ├── levelController.js
│   ├── questionController.js
│   └── progressController.js
├── middleware/           # Custom middleware
│   └── authMiddleware.js
├── models/               # Database schemas
│   ├── User.js
│   ├── Course.js
│   ├── Level.js
│   ├── Question.js
│   ├── UserProgress.js
│   └── Achievement.js
├── routes/               # API routes
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── levelRoutes.js
│   ├── questionRoutes.js
│   └── progressRoutes.js
├── utils/                # Utility functions
│   ├── questionSelector.js
│   └── achievementTracker.js
├── server.js             # Entry point
└── migrate-to-levels.js  # Data migration script
```

## Data Models

### User Model
```javascript
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
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Please provide a valid email']
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
});
```

### Course Model
```javascript
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
});
```

### Level Model
```javascript
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
```

### Question Model
```javascript
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  difficultyRating: {
    type: Number,
    required: [true, 'Please provide question difficulty rating'],
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

### UserProgress Model
```javascript
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

// Composite unique index
UserProgressSchema.index({ user: 1, course: 1, level: 1 }, { unique: true });
```

### Achievement Model
```javascript
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
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|--------------|------------------|
| POST | `/api/auth/register` | Register a new user | `{ firstName, lastName, username, email, password }` | `{ success: true, token: "JWT_TOKEN" }` |
| POST | `/api/auth/login` | Login user | `{ username, password }` | `{ success: true, token: "JWT_TOKEN" }` |
| GET | `/api/auth/me` | Get current user | - | `{ success: true, data: { user } }` |

### Course Endpoints

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|--------------|------------------|
| GET | `/api/courses` | Get all courses | - | `{ success: true, count: N, data: [courses] }` |
| GET | `/api/courses/:id` | Get single course | - | `{ success: true, data: course }` |
| POST | `/api/courses` | Create a course | `{ name, description, level }` | `{ success: true, data: course }` |

### Level Endpoints

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|--------------|------------------|
| GET | `/api/levels/course/:courseId` | Get levels for a course | - | `{ success: true, count: N, data: [levels] }` |
| GET | `/api/levels/:id` | Get level details | - | `{ success: true, data: level }` |
| POST | `/api/levels` | Create a level | `{ course, number, name, description, requiredPoints, unlockRequirements, order }` | `{ success: true, data: level }` |
| PUT | `/api/levels/:id` | Update a level | `{ name, description, requiredPoints, unlockRequirements, order }` | `{ success: true, data: level }` |

### Question Endpoints

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|--------------|------------------|
| GET | `/api/questions/level/:levelId` | Get questions for a level | - | `{ success: true, count: N, data: [questions] }` |
| POST | `/api/questions/:questionId/answer` | Submit answer | `{ optionId }` | `{ success: true, data: { isCorrect, explanation, userStats, levelProgress, newAchievements } }` |
| POST | `/api/questions` | Create a question | `{ text, type, level, difficultyRating, options, explanation, courseId }` | `{ success: true, data: question }` |

### Progress Endpoints

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|--------------|------------------|
| GET | `/api/progress/level/:levelId` | Get progress for a level | - | `{ success: true, data: progress }` |
| GET | `/api/progress/level/:levelId/status` | Check level completion | - | `{ success: true, data: { isUnlocked, isCompleted, correctAnswers, totalAnswers, questionsCompleted, nextLevel } }` |
| POST | `/api/progress/level/:levelId/reset` | Reset level progress | - | `{ success: true, message: "Level progress reset successfully" }` |

## Authentication Flow

1. **Registration**:
   - User submits registration form with required details
   - Backend validates input data
   - Password is hashed using bcrypt
   - User is saved to the database
   - JWT token is generated and returned to client

2. **Login**:
   - User submits username and password
   - Backend finds user by username
   - Password is verified using bcrypt
   - JWT token is generated and returned to client

3. **Authentication Middleware**:
   - JWT token is extracted from Authorization header
   - Token is verified using JWT_SECRET
   - User is fetched from database using token payload
   - User is attached to request object for route handlers

## Level Progression System

### Unlocking Mechanism

1. **Initial State**:
   - First level of each course is unlocked by default
   - All other levels are locked

2. **Level Completion**:
   - A level is considered completed when a user correctly answers a threshold percentage of questions (70%)
   - Completion is tracked in the UserProgress model

3. **Unlocking Next Level**:
   - When a level is completed, the next level in sequence is automatically unlocked
   - Determined by the 'order' field in the Level model
   - Unlocking updates the UserProgress record for the next level

### Progress Tracking

Progress is tracked at multiple levels:

1. **Overall User Stats**:
   - Total points earned
   - Trophies earned
   - Correct/wrong answers by question type

2. **Course Progress**:
   - Which levels are unlocked/completed
   - Performance across all levels in course

3. **Level Progress**:
   - Number of correct answers
   - Total questions attempted
   - Which specific questions have been passed
   - Completion status

## Question Selection Algorithm

The question selection system is designed to adapt to the user's performance by focusing on areas of weakness:

```javascript
exports.questionSelector = async (user, levelId, count = 10) => {
  try {
    // Find level to get course info
    const level = await Level.findById(levelId);
    if (!level) {
      throw new Error('Level not found');
    }
    
    // Calculate ratio of wrong vocabulary to wrong grammar answers
    const totalWrongVocab = user.wrongAnswers.vocabulary || 0;
    const totalWrongGrammar = user.wrongAnswers.grammar || 0;
    
    // Default to balanced mix if no wrong answers yet
    let vocabRatio = 0.5;
    
    if (totalWrongVocab + totalWrongGrammar > 0) {
      vocabRatio = totalWrongVocab / (totalWrongVocab + totalWrongGrammar);
    }
    
    // Calculate number of each type of question to return
    const vocabCount = Math.round(count * vocabRatio);
    const grammarCount = count - vocabCount;
    
    // Get questions for this level by type
    const vocabQuestions = await Question.find({ 
      level: levelId, 
      type: 'vocabulary' 
    }).limit(vocabCount);
    
    const grammarQuestions = await Question.find({ 
      level: levelId, 
      type: 'grammar' 
    }).limit(grammarCount);
    
    // Combine and shuffle questions
    const questions = [...vocabQuestions, ...grammarQuestions];
    
    // Fisher-Yates shuffle algorithm
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    return questions;
  } catch (error) {
    console.error('Error in questionSelector:', error);
    return [];
  }
};
```

## Achievement System

The application tracks user achievements through the following mechanisms:

1. **Points**:
   - Users earn 1,000 points for each correct answer
   - Users lose 500 points for each wrong answer (minimum 0)
   - Points milestones (10k, 25k, 50k, 100k) award special achievements

2. **Trophies**:
   - A trophy is awarded for every 10 correct answers
   - Tracked in the user model
   - Trophy achievements are recorded in the Achievement model

3. **Achievement Tracking**:
   - Performed after each answer submission
   - Creates achievement records in the database
   - Returns new achievements to the client

## Performance Considerations

1. **Indexing**:
   - Composite indexes on UserProgress for efficient queries
   - Indexes on Level model for course/order lookups

2. **Query Optimization**:
   - Using .lean() for read-only operations
   - Selective field projection for large documents

3. **Error Handling**:
   - Comprehensive try/catch blocks
   - Detailed error messages for debugging
   - Sanitized error responses for clients

## Data Migration

A data migration script is included to convert existing questions to the level-based system:

1. **Creates Default Levels**:
   - Three levels per course (Beginner, Intermediate, Advanced)
   - Sets appropriate unlock requirements

2. **Migrates Questions**:
   - Assigns questions to levels based on difficulty
   - Updates references from course-only to level-specific
   - Preserves original difficulty rating

3. **Run Process**:
   ```
   node migrate-to-levels.js
   ```

## Security Measures

1. **Authentication**:
   - JWT tokens with expiration
   - Password hashing with bcrypt
   - Role-based access control for admin endpoints

2. **Input Validation**:
   - Request validation with express-validator
   - Mongoose schema validation
   - Sanitization of user inputs

3. **Error Handling**:
   - Error messages do not expose sensitive information
   - Consistent error response format

## Testing

The system can be tested using Postman or another API testing tool with the included collection:

1. **Authentication Flow**:
   - Register user
   - Login
   - Access protected endpoints

2. **Course/Level Management**:
   - Create courses
   - Create levels
   - Set level dependencies

3. **Question Flow**:
   - Create questions
   - Get questions for level
   - Submit answers
   - Check progress updates