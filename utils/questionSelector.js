// utils/questionSelector.js
const Question = require('../models/Question');
const mongoose = require('mongoose');

exports.questionSelector = async (user, courseId, count = 10) => {
  try {
    // Convert string courseId to ObjectId (if needed)
    let courseObjectId;
    try {
      courseObjectId = new mongoose.Types.ObjectId(courseId);
    } catch (error) {
      console.error('Invalid courseId format:', error.message);
      return [];
    }
    
    console.log(`Looking for questions with course ID: ${courseObjectId}`);
    
    // Calculate ratio of wrong vocabulary to wrong grammar answers
    const totalWrongVocab = user.wrongAnswers.vocabulary || 0;
    const totalWrongGrammar = user.wrongAnswers.grammar || 0;
    
    // If user has no wrong answers yet, give a balanced mix
    let vocabRatio = 0.5;
    
    if (totalWrongVocab + totalWrongGrammar > 0) {
      vocabRatio = totalWrongVocab / (totalWrongVocab + totalWrongGrammar);
    }
    
    // Number of vocabulary questions to return
    const vocabCount = Math.round(count * vocabRatio);
    // Number of grammar questions to return
    const grammarCount = count - vocabCount;
    
    console.log(`Vocabulary questions: ${vocabCount}, Grammar questions: ${grammarCount}`);
    
    // Use simple find queries instead of aggregation for stability
    const vocabQuestions = await Question.find({ 
      course: courseId.toString(), 
      type: 'vocabulary' 
    }).limit(vocabCount).lean();
    
    const grammarQuestions = await Question.find({ 
      course: courseId.toString(), 
      type: 'grammar' 
    }).limit(grammarCount).lean();
    
    console.log(`Found ${vocabQuestions.length} vocabulary questions and ${grammarQuestions.length} grammar questions`);
    
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