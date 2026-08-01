'use strict';

// Adjust these paths to match where these modules actually live in your
// repo — mirrors the requires already used in assessment-result.services.js.
const candidateAnswerRepo = require('../candidate-answer/candidate-answer.repository');
const attemptRepo = require('../exam-attempt/exam-attempt.repository');
const loader = require('../question/question.loader');

const scoringEngine = require('./engine/scoringEngine');
const boundsCalculator = require('./engine/boundsCalculator');
const categoryAggregator = require('./engine/categoryAggregator');
const overallCalculator = require('./engine/overallCalculator');
const percentileCalculator = require('./engine/percentileCalculator');
const developmentCalculator = require('./engine/developmentCalculator');
const reportBuilder = require('./engine/reportBuilder');

// Optional — see src/data/developmentAdvice.json for the shape. Swap for a
// DB-backed lookup later without changing anything else in this file.
const developmentAdvice = require('../../data/developmentAdvice.json');

/**
 * Loads an attempt's answers and its question bank, hydrates each question
 * with its type (the selectedQuestions group key), and returns the
 * { questions, answersByQuestionId } shape scoringEngine expects.
 *
 * This is the one place that knows how questions get loaded — the engine
 * and all the calculators only ever see plain in-memory data, which is
 * what keeps them trivially unit-testable.
 */
async function buildSession(attemptId, companyId) {
  const attempt = await attemptRepo.findById(attemptId, companyId);
  if (!attempt) {
    throw new Error(`Exam attempt ${attemptId} not found`);
  }

  const answers = await candidateAnswerRepo.listByAttempt(attemptId);
  const answersByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

  const questions = [];
  for (const type of Object.keys(attempt.selectedQuestions || {})) {
    for (const id of attempt.selectedQuestions[type]) {
      const question = loader.getQuestionById(id);
      if (!question) continue; // question removed from bank since attempt was built — skip rather than crash
      // `type` here is the selectedQuestions group key (LIKERT / SJQ /
      // FORCED_CHOICE / ...). If your question bank JSON already stores
      // `type` per question, this is a no-op; if not, this is what wires
      // each question to the correct scorer.
      questions.push({ ...question, type: question.type || type });
    }
  }

  return { attempt, questions, answersByQuestionId };
}

/**
 * Runs the full scoring pipeline for one attempt and returns everything
 * needed to persist an AssessmentResult row (see assessment_results table
 * in the architecture doc) — this function does NOT write to the database
 * itself, matching the read-only-engine principle the rest of this module
 * follows. Call repo.upsert(...) with this function's return value from
 * wherever generateForAttempt() lives.
 *
 * @param {object} params
 * @param {string} params.attemptId
 * @param {string} params.companyId
 * @param {number[]} [params.norms] - see percentileCalculator.js; omit
 *   until you have a real norm/benchmark dataset
 */
async function scoreAttempt({ attemptId, companyId, norms }) {
  const { questions, answersByQuestionId } = await buildSession(attemptId, companyId);

  const session = { attemptId, questions, answersByQuestionId };

  const { contributions, answerScores, unanswered } = scoringEngine.scoreAssessment(session);

  const { bounds, questionCounts } = boundsCalculator.calculateBounds(questions);
  const { categoryScores, categoryRaw } = categoryAggregator.aggregate(contributions, bounds);

  const overallScore = overallCalculator.calculateOverall(categoryScores);
  const recommendation = overallCalculator.recommendationFor(overallScore);
  const overallPercentile = percentileCalculator.calculatePercentile(overallScore, norms);

  const { strengths, developmentAreas } = developmentCalculator.calculate(
    categoryScores,
    developmentAdvice,
    { questionCounts }
  );

  const report = reportBuilder.build({
    overallScore,
    overallPercentile,
    recommendation,
    categoryScores,
    strengths,
    developmentAreas,
    unanswered,
  });

  return {
    overallScore,
    overallPercentile,
    recommendation,
    categoryScores,
    categoryRaw,
    strengths,
    developmentAreas,
    report,
    // Per-question scores, if you want to persist them back onto
    // CandidateAnswer.score — no repo method for that was defined in what
    // you've shared, so wiring this up is left to the caller:
    //   await Promise.all(answerScores.map(({questionId, score}) =>
    //     candidateAnswerRepo.updateScore(attemptId, questionId, score)));
    answerScores,
    unanswered,
  };
}

module.exports = { scoreAttempt, buildSession };