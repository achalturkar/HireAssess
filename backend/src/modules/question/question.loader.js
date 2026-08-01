'use strict';

const fs = require('fs');
const path = require('path');

const cache = {};

const LEVELS = ['ENTRY', 'MID', 'TOP'];

const FILES = {
  LIKERT: 'likert.json',
  SITUATIONAL_JUDGEMENT: 'sjq.json',
  FORCED_CHOICE: 'forced_choice_quads.json',
};

const loadQuestions = () => {
  LEVELS.forEach((level) => {
    cache[level] = {};

    Object.entries(FILES).forEach(([type, fileName]) => {
      const filePath = path.join(
        process.cwd(),
        'src',
        'data',
        level.toLowerCase(),
        fileName
      );

      if (!fs.existsSync(filePath)) {
        cache[level][type] = [];
        console.warn(`Question file not found: ${filePath}`);
        return;
      }

      try {
        const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        cache[level][type] = questions;

        console.log(
          `Loaded ${questions.length} ${type} questions for ${level}`
        );
      } catch (err) {
        console.error(filePath, err.message);
        cache[level][type] = [];
      }
    });
  });
};

const getQuestions = (level, type) => {
  return cache[level]?.[type] || [];
};
const getQuestionById = (id) => {
    const allQuestions = [
        ...getQuestions("ENTRY", "LIKERT"),
        ...getQuestions("ENTRY", "FORCED_CHOICE"),
        ...getQuestions("ENTRY", "SITUATIONAL_JUDGEMENT"),

        ...getQuestions("MID", "LIKERT"),
        ...getQuestions("MID", "FORCED_CHOICE"),
        ...getQuestions("MID", "SITUATIONAL_JUDGEMENT"),

        ...getQuestions("TOP", "LIKERT"),
        ...getQuestions("TOP", "FORCED_CHOICE"),
        ...getQuestions("TOP", "SITUATIONAL_JUDGEMENT"),
    ];

    return allQuestions.find(q => q.id === id);
};



module.exports = {
  loadQuestions,
  getQuestions,
      getQuestionById,

};