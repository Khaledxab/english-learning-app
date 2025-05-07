// migrate-to-levels.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');
const Question = require('./models/Question');
const Level = require('./models/Level');

// Load environment variables
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateToLevels = async () => {
  try {
    // Get all courses
    const courses = await Course.find();
    
    for (const course of courses) {
      console.log(`Migrating questions for course: ${course.name}`);
      
      // Create default levels for each course (3 levels)
      const levels = [
        {
          course: course._id,
          number: 1,
          name: 'Beginner',
          description: 'Basic concepts and vocabulary',
          requiredPoints: 0,
          order: 1
        },
        {
          course: course._id,
          number: 2,
          name: 'Intermediate',
          description: 'More advanced concepts',
          requiredPoints: 1000,
          unlockRequirements: {
            requiredCorrectAnswers: 7
          },
          order: 2
        },
        {
          course: course._id,
          number: 3,
          name: 'Advanced',
          description: 'Complex language and grammar',
          requiredPoints: 2000,
          unlockRequirements: {
            requiredCorrectAnswers: 7
          },
          order: 3
        }
      ];
      
      // Create levels
      const createdLevels = [];
      for (const levelData of levels) {
        // Check if level already exists
        let level = await Level.findOne({ 
          course: course._id, 
          number: levelData.number 
        });
        
        if (!level) {
          level = await Level.create(levelData);
          console.log(`Created level: ${level.name}`);
        } else {
          console.log(`Level ${level.name} already exists`);
        }
        
        createdLevels.push(level);
      }
      
      // Get all questions for this course
      const questions = await Question.find({ course: course._id });
      
      // Distribute questions among levels based on difficulty
      for (const question of questions) {
        // Assign level based on original level value
        // 1-33 -> Beginner, 34-66 -> Intermediate, 67-100 -> Advanced
        let levelIndex = 0;
        
        if (question.level > 33 && question.level <= 66) {
          levelIndex = 1;
        } else if (question.level > 66) {
          levelIndex = 2;
        }
        
        // Update question to reference level
        await Question.findByIdAndUpdate(question._id, {
          level: createdLevels[levelIndex]._id,
          difficultyRating: question.level // Keep original level as difficultyRating
        });
        
        console.log(`Updated question: ${question._id} to level: ${createdLevels[levelIndex].name}`);
      }
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

migrateToLevels();