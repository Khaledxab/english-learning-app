// seed.js - Run with: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Course = require('./models/Course');
const Level = require('./models/Level');
const Question = require('./models/Question');
const User = require('./models/User');
const UserProgress = require('./models/UserProgress');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB Connected');
  seed();
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

const seed = async () => {
  try {
    // Clear existing data
    await Course.deleteMany({});
    await Level.deleteMany({});
    await Question.deleteMany({});
    await UserProgress.deleteMany({});
    
    console.log('Existing data cleared');

    // Create a default admin user if it doesn't exist
    const existingUser = await User.findOne({ username: 'admin' });
    
    let user;
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword
      });
      console.log('Default admin user created');
    } else {
      user = existingUser;
      console.log('Using existing admin user');
    }

    // Create courses
    const generalEnglish = await Course.create({
      name: 'General English',
      description: 'Learn everyday English for general communication',
      level: 'Beginner'
    });

    const businessEnglish = await Course.create({
      name: 'Business English',
      description: 'English for professional and workplace communication',
      level: 'Intermediate'
    });

    const kidsProgram = await Course.create({
      name: 'Kids Program',
      description: 'Fun and engaging English lessons for children',
      level: 'Beginner'
    });

    console.log('Courses created');

    // Create levels for General English
    const geLevel1 = await Level.create({
      course: generalEnglish._id,
      number: 1,
      name: 'Basic Vocabulary',
      description: 'Learn basic everyday words',
      requiredPoints: 0,
      order: 1
    });

    const geLevel2 = await Level.create({
      course: generalEnglish._id,
      number: 2,
      name: 'Simple Grammar',
      description: 'Basic grammar constructions',
      requiredPoints: 1000,
      order: 2,
      unlockRequirements: {
        previousLevelId: geLevel1._id,
        requiredCorrectAnswers: 5
      }
    });

    const geLevel3 = await Level.create({
      course: generalEnglish._id,
      number: 3,
      name: 'Conversations',
      description: 'Simple everyday conversations',
      requiredPoints: 2000,
      order: 3,
      unlockRequirements: {
        previousLevelId: geLevel2._id,
        requiredCorrectAnswers: 5
      }
    });

    // Create levels for Business English
    const beLevel1 = await Level.create({
      course: businessEnglish._id,
      number: 1,
      name: 'Office Vocabulary',
      description: 'Learn common office and business terms',
      requiredPoints: 0,
      order: 1
    });

    const beLevel2 = await Level.create({
      course: businessEnglish._id,
      number: 2,
      name: 'Email Writing',
      description: 'Professional email communication',
      requiredPoints: 1000,
      order: 2,
      unlockRequirements: {
        previousLevelId: beLevel1._id,
        requiredCorrectAnswers: 5
      }
    });

    // Create levels for Kids Program
    const kpLevel1 = await Level.create({
      course: kidsProgram._id,
      number: 1,
      name: 'Animals and Colors',
      description: 'Learn animal names and colors',
      requiredPoints: 0,
      order: 1
    });

    const kpLevel2 = await Level.create({
      course: kidsProgram._id,
      number: 2,
      name: 'Numbers and Counting',
      description: 'Learn to count and use numbers',
      requiredPoints: 1000,
      order: 2,
      unlockRequirements: {
        previousLevelId: kpLevel1._id,
        requiredCorrectAnswers: 5
      }
    });

    console.log('Levels created');

    // Create questions for General English Level 1
    const geL1Questions = [
      {
        text: 'What do you call the place where you sleep?',
        type: 'vocabulary',
        level: geLevel1._id,
        difficultyRating: 10,
        options: [
          { text: 'Bedroom', isCorrect: true },
          { text: 'Kitchen', isCorrect: false },
          { text: 'Bathroom', isCorrect: false },
          { text: 'Living room', isCorrect: false }
        ],
        explanation: 'A bedroom is the room in a house where people sleep.',
        course: generalEnglish._id
      },
      {
        text: 'Which word means "the first meal of the day"?',
        type: 'vocabulary',
        level: geLevel1._id,
        difficultyRating: 15,
        options: [
          { text: 'Lunch', isCorrect: false },
          { text: 'Dinner', isCorrect: false },
          { text: 'Breakfast', isCorrect: true },
          { text: 'Snack', isCorrect: false }
        ],
        explanation: 'Breakfast is the first meal of the day, typically eaten in the morning.',
        course: generalEnglish._id
      },
      {
        text: 'She ____ to the store yesterday.',
        type: 'grammar',
        level: geLevel1._id,
        difficultyRating: 20,
        options: [
          { text: 'go', isCorrect: false },
          { text: 'goes', isCorrect: false },
          { text: 'went', isCorrect: true },
          { text: 'going', isCorrect: false }
        ],
        explanation: 'For past actions, we use the past tense form "went".',
        course: generalEnglish._id
      }
    ];

    await Question.insertMany(geL1Questions);

    // Create questions for General English Level 2
    const geL2Questions = [
      {
        text: 'I ____ studying English for two years.',
        type: 'grammar',
        level: geLevel2._id,
        difficultyRating: 30,
        options: [
          { text: 'am', isCorrect: false },
          { text: 'have been', isCorrect: true },
          { text: 'was', isCorrect: false },
          { text: 'were', isCorrect: false }
        ],
        explanation: 'We use "have been" with the present perfect continuous to describe an action that started in the past and continues to the present.',
        course: generalEnglish._id
      },
      {
        text: 'If it ____ tomorrow, we will cancel the picnic.',
        type: 'grammar',
        level: geLevel2._id,
        difficultyRating: 35,
        options: [
          { text: 'rains', isCorrect: true },
          { text: 'will rain', isCorrect: false },
          { text: 'is raining', isCorrect: false },
          { text: 'rained', isCorrect: false }
        ],
        explanation: 'In first conditional sentences, we use the present simple tense after "if" and the future tense in the main clause.',
        course: generalEnglish._id
      }
    ];

    await Question.insertMany(geL2Questions);
    
    // Create questions for Business English Level 1
    const beL1Questions = [
      {
        text: 'What is a "deadline"?',
        type: 'vocabulary',
        level: beLevel1._id,
        difficultyRating: 20,
        options: [
          { text: 'A new product', isCorrect: false },
          { text: 'A time by which something must be completed', isCorrect: true },
          { text: 'A type of business meeting', isCorrect: false },
          { text: 'An office supply', isCorrect: false }
        ],
        explanation: 'A deadline is the time by which a task must be completed.',
        course: businessEnglish._id
      },
      {
        text: 'Which phrase is best for beginning a formal email?',
        type: 'vocabulary',
        level: beLevel1._id,
        difficultyRating: 25,
        options: [
          { text: 'Hey there,', isCorrect: false },
          { text: 'What\'s up?', isCorrect: false },
          { text: 'Dear Sir/Madam,', isCorrect: true },
          { text: 'Yo!', isCorrect: false }
        ],
        explanation: '"Dear Sir/Madam" is a formal salutation used when you don\'t know the recipient\'s name.',
        course: businessEnglish._id
      }
    ];

    await Question.insertMany(beL1Questions);
    
    // Create questions for Kids Program Level 1
    const kpL1Questions = [
      {
        text: 'What color is a banana?',
        type: 'vocabulary',
        level: kpLevel1._id,
        difficultyRating: 5,
        options: [
          { text: 'Red', isCorrect: false },
          { text: 'Blue', isCorrect: false },
          { text: 'Yellow', isCorrect: true },
          { text: 'Green', isCorrect: false }
        ],
        explanation: 'Bananas are yellow when ripe!',
        course: kidsProgram._id
      },
      {
        text: 'Which animal says "meow"?',
        type: 'vocabulary',
        level: kpLevel1._id,
        difficultyRating: 5,
        options: [
          { text: 'Dog', isCorrect: false },
          { text: 'Cat', isCorrect: true },
          { text: 'Fish', isCorrect: false },
          { text: 'Bird', isCorrect: false }
        ],
        explanation: 'Cats make the sound "meow"!',
        course: kidsProgram._id
      }
    ];

    await Question.insertMany(kpL1Questions);

    console.log('Questions created');

    // Create initial progress for the user
    await UserProgress.create({
      user: user._id,
      course: generalEnglish._id,
      level: geLevel1._id,
      unlocked: true,
      completed: false,
      correctAnswers: 0,
      totalAnswers: 0,
      questionsPassed: []
    });

    await UserProgress.create({
      user: user._id,
      course: businessEnglish._id,
      level: beLevel1._id,
      unlocked: true,
      completed: false,
      correctAnswers: 0,
      totalAnswers: 0,
      questionsPassed: []
    });

    await UserProgress.create({
      user: user._id,
      course: kidsProgram._id,
      level: kpLevel1._id,
      unlocked: true,
      completed: false,
      correctAnswers: 0,
      totalAnswers: 0,
      questionsPassed: []
    });

    console.log('User progress initialized');
    console.log('Seed data inserted successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};