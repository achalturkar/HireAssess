'use strict';

const loader = require('./question.loader');

const mapper = require('./question.mapper');

const shuffle = (array) => {
  const items = [...array];

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
};

const pickRandom = (questions, count) => {
  if (!count) return [];

  if (count > questions.length) {
    throw new Error(
      `Requested ${count} questions but only ${questions.length} available`
    );
  }

  return shuffle(questions).slice(0, count);
};

const generateQuestionSet = ({
  level,
  likertCount,
  sjqCount,
  forcedChoiceCount,
}) => {

  const likert = pickRandom(
    loader.getQuestions(level, 'LIKERT'),
    likertCount
  ).map(mapper.mapLikert);

  const sjq = pickRandom(
    loader.getQuestions(level, 'SITUATIONAL_JUDGEMENT'),
    sjqCount
  ).map(mapper.mapSjq);

  const forced = pickRandom(
    loader.getQuestions(level, 'FORCED_CHOICE'),
    forcedChoiceCount
  ).map(mapper.mapForcedChoice);

return {
    LIKERT: likert.map(q => q.id),
    SITUATIONAL_JUDGEMENT: sjq.map(q => q.id),
    FORCED_CHOICE: forced.map(q => q.id),
};
};

module.exports = {
  generateQuestionSet,
};