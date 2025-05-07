# English Learning Application

A comprehensive backend API for an English learning platform that offers adaptive learning for vocabulary and grammar questions across multiple course types.

## Features

- **User Authentication**: Register and login with JWT token-based authentication
- **User Profiles**: Track progress, points, and achievements
- **Adaptive Learning**: Question selection adapts based on user performance
- **Multiple Course Types**: General English, Business English, Kids Program, and more
- **Progress Tracking**: Earn points and trophies for correct answers
- **Level-based Roadmap**: Progressive unlocking of content based on user achievements

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing
- **Validation**: Express Validator

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/english-learning-app.git
cd english-learning-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/english_learning_app
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
```

4. Seed the database with initial data:
```bash
node seed.js -i
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user profile

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/achievements` - Get user achievements

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get a single course
- `POST /api/courses` - Create a new course

### Questions
- `GET /api/questions/course/:courseId` - Get adaptive questions for a course
- `POST /api/questions/:questionId/answer` - Submit an answer for a question
- `POST /api/questions` - Create a new question
- `POST /api/questions/batch` - Create multiple questions at once

### Levels (Roadmap)
- `GET /api/levels/course/:courseId` - Get all levels for a course