'use strict';

const { getScorer } = require('../scorers');

/**
 * Runs every answer in a session through its question's registered scorer
 * and flattens the results into two things the rest of the pipeline needs:
 *
 *   - contributions: every {category, points, maxPoints} produced by every
 *     answer, un-aggregated (categoryAggregator sums these per category)
 *   - answerScores: one {questionId, score} per answer, suitable for
 *     writing back onto CandidateAnswer.score if you want that persisted
 *
 * This function deliberately does NOT touch the database — it's pure
 * input-in, result-out, which is what makes it easy to unit test and what
 * lets scoring.service.js own all the loading/saving.
 *
 * @param {object} session
 * @param {Array<object>} session.questions - hydrated question objects,
 *   each with at least { id, type, ...type-specific fields }
 * @param {Map<string, object>} session.answersByQuestionId - questionId ->
 *   CandidateAnswer row (must have `.answer`, the raw JSON payload)
 */
function scoreAssessment(session) {
  const { questions, answersByQuestionId } = session;

  const contributions = [];
  const answerScores = [];
  const unanswered = [];

  for (const question of questions) {
    const answerRow = answersByQuestionId.get(question.id);

    if (!answerRow) {
      unanswered.push(question.id);
      continue;
    }

    const scorer = getScorer(question.type);
    const { raw, contributions: questionContributions } = scorer.score(question, answerRow.answer);

    answerScores.push({ questionId: question.id, score: raw });

    for (const c of questionContributions) {
      contributions.push({ ...c, questionId: question.id, questionType: question.type });
    }
  }

  return { contributions, answerScores, unanswered };
}

module.exports = { scoreAssessment };