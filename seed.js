const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');
const Question = require('./models/Question');

// Load environment variables
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample courses
const courses = [
  {
    name: 'General English',
    description: 'A comprehensive course for general English proficiency.',
    level: 'Intermediate'
  },
  {
    name: 'Business English',
    description: 'English for professional and business contexts.',
    level: 'Advanced'
  },
  {
    name: 'Kids Program',
    description: 'Fun and engaging English learning for children.',
    level: 'Beginner'
  }
];

// Sample vocabulary questions for General English
const generalEnglishVocabularyQuestions = [
  {
    text: 'What is the meaning of the word "ubiquitous"?',
    type: 'vocabulary',
    level: 15,
    options: [
      { text: 'Rare', isCorrect: false },
      { text: 'Present everywhere', isCorrect: true },
      { text: 'Dangerous', isCorrect: false },
      { text: 'Unique', isCorrect: false }
    ],
    explanation: 'Ubiquitous means present, appearing, or found everywhere.'
  },
  {
    text: 'Which word is a synonym for "begin"?',
    type: 'vocabulary',
    level: 5,
    options: [
      { text: 'End', isCorrect: false },
      { text: 'Stop', isCorrect: false },
      { text: 'Commence', isCorrect: true },
      { text: 'Finish', isCorrect: false }
    ],
    explanation: 'Commence means to begin or start something.'
  }
];

// Sample grammar questions for General English
const generalEnglishGrammarQuestions = [
  {
    text: 'Which sentence uses the past perfect tense correctly?',
    type: 'grammar',
    level: 20,
    options: [
      { text: 'I have eaten lunch yesterday.', isCorrect: false },
      { text: 'I had eaten lunch before he arrived.', isCorrect: true },
      { text: 'I was eating lunch when he had arrived.', isCorrect: false },
      { text: 'I did eat lunch after he had arrived.', isCorrect: false }
    ],
    explanation: 'The past perfect tense (had + past participle) is used to express an action that occurred before another action in the past.'
  },
  {
    text: 'Which sentence contains a split infinitive?',
    type: 'grammar',
    level: 25,
    options: [
      { text: 'She decided to quickly leave the party.', isCorrect: true },
      { text: 'She quickly decided to leave the party.', isCorrect: false },
      { text: 'She decided quickly to leave the party.', isCorrect: false },
      { text: 'She decided to leave the party quickly.', isCorrect: false }
    ],
    explanation: 'A split infinitive occurs when a word or phrase comes between "to" and the verb in an infinitive. In this case, "quickly" splits the infinitive "to leave".'
  }
];

// Import function to seed the database
// At the bottom of seed.js, modify the importData function
const importData = async () => {
    try {
      // Clear database
      await Course.deleteMany();
      await Question.deleteMany();
      
      // Insert courses
      const createdCourses = await Course.insertMany(courses);
      
      // Get IDs for all courses
      const generalEnglishCourse = createdCourses[0]._id;
      const businessEnglishCourse = createdCourses[1]._id;
      const kidsEnglishCourse = createdCourses[2]._id;
      
      // Generate more questions - 10 vocab and 10 grammar for each course
      const allQuestions = [];
      
      // Sample questions for all courses - just add a few more examples for each course
      [generalEnglishCourse, businessEnglishCourse, kidsEnglishCourse].forEach(courseId => {
        // Add 10 vocab questions
        for (let i = 1; i <= 10; i++) {
          allQuestions.push({
            text: `Vocabulary Question ${i} for course ${courseId}`,
            type: 'vocabulary',
            level: Math.floor(Math.random() * 100) + 1,
            options: [
              { text: 'Option A', isCorrect: i % 4 === 0 },
              { text: 'Option B', isCorrect: i % 4 === 1 },
              { text: 'Option C', isCorrect: i % 4 === 2 },
              { text: 'Option D', isCorrect: i % 4 === 3 }
            ],
            explanation: `Explanation for vocabulary question ${i}`,
            course: courseId
          });
        }
        
        // Add 10 grammar questions
        for (let i = 1; i <= 10; i++) {
          allQuestions.push({
            text: `Grammar Question ${i} for course ${courseId}`,
            type: 'grammar',
            level: Math.floor(Math.random() * 100) + 1,
            options: [
              { text: 'Option A', isCorrect: i % 4 === 0 },
              { text: 'Option B', isCorrect: i % 4 === 1 },
              { text: 'Option C', isCorrect: i % 4 === 2 },
              { text: 'Option D', isCorrect: i % 4 === 3 }
            ],
            explanation: `Explanation for grammar question ${i}`,
            course: courseId
          });
        }
      });
      
      // Insert all questions
      await Question.insertMany(allQuestions);
      
      console.log('Data imported!');
      process.exit();
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };

// Delete all data
const deleteData = async () => {
  try {
    await Course.deleteMany();
    await Question.deleteMany();
    
    console.log('Data destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run command: node seed.js -i (to import) or node seed.js -d (to delete)
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use -i to import or -d to delete data');
  process.exit();
}