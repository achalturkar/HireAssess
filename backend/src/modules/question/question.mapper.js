'use strict';

const mapLikert = (question) => ({
  id: question.id,
  type: 'LIKERT',
  competency: question.category,
  text: question.question,
  reverseScored: question.reverse_scored,
});

const mapSjq = (question) => ({
  id: question.id,
  type: 'SITUATIONAL_JUDGEMENT',
  competency: question.category,
  text: question.scenario,
  options: question.options,
});

const mapAnalytical = (question) => ({
  id: question.id,
  type: 'ANALYTICAL',
  competency: question.category,
  text: question.scenario,
  options: question.options,
});

const mapLogicalReasoning = (question) => ({
  id: question.id,
  type: 'LOGICAL_REASONING',
  competency: question.category,
  text: question.scenario,
  options: question.options,
});

const mapForcedChoice = (question) => ({
  id: question.id,
  type: 'FORCED_CHOICE',
  items: question.items,
});

module.exports = {
  mapLikert,
  mapSjq,
  mapForcedChoice,
  mapAnalytical,
  mapLogicalReasoning,
};