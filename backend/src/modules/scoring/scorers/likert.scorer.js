'use strict';

/**
 * LIKERT scorer.
 *
 * Question shape assumed (matches your lk-bank JSON):
 *   { id, type: 'LIKERT', category, question, reverseScored?, weight? }
 * Answer shape (CandidateAnswer.answer):
 *   { value: 1 | 2 | 3 | 4 | 5 }
 *
 * Every scorer in this module implements the same two-function contract so
 * the engine and bounds calculator can treat all question types uniformly:
 *
 *   score(question, answer) -> { raw, contributions }
 *   possibleContributions(question) -> [{ category, minPoints, maxPoints }]
 *
 * `possibleContributions` lets boundsCalculator work out the min/max a
 * category could ever score *without* needing a real answer — required to
 * normalize raw point totals onto a 0-100 scale.
 */

const SCALE_MIN = 1;
const SCALE_MAX = 5;

function normalizedValue(question, rawValue) {
  if (rawValue === null || rawValue === undefined) return null;
  return question.reverseScored ? SCALE_MAX + SCALE_MIN - rawValue : rawValue;
}

function score(question, answer) {
  const rawValue = answer?.value ?? null;
  const points = normalizedValue(question, rawValue);

  if (points === null) {
    return { raw: null, contributions: [] };
  }

  return {
    raw: points,
    contributions: [
      {
        category: question.category,
        points,
        maxPoints: SCALE_MAX,
      },
    ],
  };
}

function possibleContributions(question) {
  return [{ category: question.category, minPoints: SCALE_MIN, maxPoints: SCALE_MAX }];
}

module.exports = { score, possibleContributions };