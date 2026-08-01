'use strict';

const likert = require('./likert.scorer');
const sjq = require('./sjq.scorer');
const forcedChoice = require('./forcedChoice.scorer');
const analytical = require('./analytical.scorer');
const logicalReasoning = require('./logicalReasoning.scorer');

/**
 * Question-type -> scorer registry. This is the entire "plugin" seam:
 * adding CODING, VERBAL, NUMERICAL, etc. later means writing a new scorer
 * module that implements { score, possibleContributions } and adding one
 * line here — scoringEngine.js never changes.
 *
 * These keys must exactly match whatever `question.type` (or the
 * attempt.selectedQuestions group key, per scoring.service.js's
 * buildSession fallback) resolves to for each question — mismatches fail
 * loudly via getScorer() below rather than silently mis-scoring.
 */
const REGISTRY = {
  LIKERT: likert,
  SITUATIONAL_JUDGEMENT: sjq,
  FORCED_CHOICE: forcedChoice,
  ANALYTICAL: analytical,
  LOGICAL_REASONING: logicalReasoning,
};

function getScorer(questionType) {
  const scorer = REGISTRY[questionType];
  if (!scorer) {
    throw new Error(
      `No scorer registered for question type "${questionType}". ` +
        `Registered types: ${Object.keys(REGISTRY).join(', ')}`
    );
  }
  return scorer;
}

module.exports = { REGISTRY, getScorer };