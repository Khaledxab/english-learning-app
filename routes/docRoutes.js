// routes/docRoutes.js
const express = require('express');
const router = express.Router();

/**
 * @desc    Get API Documentation
 * @route   GET /api/docs
 * @access  Public
 */
router.get('/', (req, res) => {
  const apiDocs = {
    name: 'English Learning API',
    version: '1.0.0',
    description: 'API Documentation for English Learning Application',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      authentication: {
        register: {
          url: '/api/auth/register',
          method: 'POST',
          description: 'Register a new user',
          body: {
            firstName: 'String (required)',
            lastName: 'String (required)',
            username: 'String (required, unique)',
            email: 'String (required, unique)',
            password: 'String (required, min 6 characters)'
          },
          response: {
            success: 'Boolean',
            token: 'String (JWT)'
          }
        },
        login: {
          url: '/api/auth/login',
          method: 'POST',
          description: 'Login a user',
          body: {
            username: 'String (required)',
            password: 'String (required)'
          },
          response: {
            success: 'Boolean',
            token: 'String (JWT)'
          }
        },
        getCurrentUser: {
          url: '/api/auth/me',
          method: 'GET',
          description: 'Get current user information',
          headers: {
            Authorization: 'Bearer [token]'
          },
          response: {
            success: 'Boolean',
            data: 'User object'
          }
        }
      },
      users: {
        getUserProfile: {
          url: '/api/users/profile',
          method: 'GET',
          description: 'Get user profile with achievements',
          headers: {
            Authorization: 'Bearer [token]'
          },
          response: {
            success: 'Boolean',
            data: {
              user: 'User object',
              achievements: 'Array of achievement objects'
            }
          }
        },
        updateUserProfile: {
          url: '/api/users/profile',
          method: 'PUT',
          description: 'Update user profile',
          headers: {
            Authorization: 'Bearer [token]'
          },
          body: {
            firstName: 'String (optional)',
            lastName: 'String (optional)',
            email: 'String (optional)'
          },
          response: {
            success: 'Boolean',
            data: 'Updated user object'
          }
        },
        getUserAchievements: {
          url: '/api/users/achievements',
          method: 'GET',
          description: 'Get user achievements',
          headers: {
            Authorization: 'Bearer [token]'
          },
          response: {
            success: 'Boolean',
            count: 'Number of achievements',
            data: 'Array of achievement objects'
          }
        }
      },
      courses: {
        getAllCourses: {
          url: '/api/courses',
          method: 'GET',
          description: 'Get all available courses',
          headers: {
            Authorization: 'Bearer [token]'
          },
          response: {
            success: 'Boolean',
            count: 'Number of courses',
            data: 'Array of course objects'
          }
        },
        getSingleCourse: {
          url: '/api/courses/:id',
          method: 'GET',
          description: 'Get a single course by ID',
          headers: {
            Authorization: 'Bearer [token]'
          },
          params: {
            id: 'Course ID (MongoDB ObjectId)'
          },
          response: {
            success: 'Boolean',
            data: 'Course object'
          }
        }
      },
      questions: {
        getQuestionsForCourse: {
          url: '/api/questions/course/:courseId',
          method: 'GET',
          description: 'Get adaptive questions for a course',
          headers: {
            Authorization: 'Bearer [token]'
          },
          params: {
            courseId: 'Course ID (MongoDB ObjectId)'
          },
          response: {
            success: 'Boolean',
            count: 'Number of questions',
            data: 'Array of question objects (without correct answer marked)'
          }
        },
        submitAnswer: {
          url: '/api/questions/:questionId/answer',
          method: 'POST',
          description: 'Submit an answer for a question',
          headers: {
            Authorization: 'Bearer [token]'
          },
          params: {
            questionId: 'Question ID (MongoDB ObjectId)'
          },
          body: {
            optionId: 'Option ID (MongoDB ObjectId)'
          },
          response: {
            success: 'Boolean',
            data: {
              isCorrect: 'Boolean',
              explanation: 'String',
              userStats: 'Object with updated user stats',
              newAchievements: 'Array of new achievements earned'
            }
          }
        }
      }
    }
  };

  res.status(200).json(apiDocs);
});

module.exports = router;