const Achievement = require('../models/Achievement');
const User = require('../models/User');
const config = require('../config/config');

/**
 * Track user achievements after answering a question
 * Award trophies for every 10 correct answers
 * 
 * @param {Object} user - User document
 */
exports.trackAchievements = async (user) => {
  const newAchievements = [];
  
  // Check for trophy eligibility
  const correctAnswersCount = user.totalCorrectAnswers;
  const eligibleTrophies = Math.floor(correctAnswersCount / config.trophyThreshold);
  
  // If the user has earned new trophies
  if (eligibleTrophies > user.trophies) {
    const newTrophiesCount = eligibleTrophies - user.trophies;
    
    // Update user trophies count
    user.trophies = eligibleTrophies;
    await user.save();
    
    // Create achievement records
    for (let i = 0; i < newTrophiesCount; i++) {
      const trophyNumber = user.trophies - newTrophiesCount + i + 1;
      
      const achievement = await Achievement.create({
        user: user._id,
        type: 'trophy',
        description: `Trophy #${trophyNumber} for answering ${trophyNumber * config.trophyThreshold} questions correctly!`,
        points: 0 // Trophies don't give extra points
      });
      
      newAchievements.push(achievement);
    }
  }
  
  // Check for point milestone achievements (e.g., 10k, 25k, 50k, 100k points)
  const pointMilestones = [10000, 25000, 50000, 100000];
  
  for (const milestone of pointMilestones) {
    // Check if user crossed a milestone with the last answer
    if (user.points >= milestone) {
      // Check if this achievement already exists
      const existingAchievement = await Achievement.findOne({
        user: user._id,
        type: 'point_milestone',
        description: `Reached ${milestone.toLocaleString()} points!`
      });
      
      if (!existingAchievement) {
        const achievement = await Achievement.create({
          user: user._id,
          type: 'point_milestone',
          description: `Reached ${milestone.toLocaleString()} points!`,
          points: milestone
        });
        
        newAchievements.push(achievement);
      }
    }
  }
  
  return newAchievements;
};
