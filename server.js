const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
// Add this to server.js before the default route
app.get('/debug-database', async (req, res) => {
  try {
    const Course = require('./models/Course');
    const Question = require('./models/Question');
    
    const courses = await Course.find();
    const questions = await Question.find();
    
    res.json({
      success: true,
      courses,
      questions,
      totalCourses: courses.length,
      totalQuestions: questions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));

app.use('/api/levels', require('./routes/levelRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

// Add this after your other middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});