module.exports = {
    courseTypes: ['General English', 'Business English', 'Kids Program'],
    questionTypes: ['vocabulary', 'grammar'],
    questionLevels: Array.from({ length: 100 }, (_, i) => i + 1),
    points: {
      correctAnswer: 1000,
      wrongAnswer: -500
    },
    trophyThreshold: 10 // Number of correct answers to earn a trophy
  };