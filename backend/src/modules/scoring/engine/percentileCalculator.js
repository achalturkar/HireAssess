'use strict';

/**
 * Percentile rank of `overallScore` among a norm group.
 *
 * ASSUMPTION / GAP: no benchmark or norm dataset was defined anywhere in
 * what you've shared so far (the spec mentions it under the Analytics
 * Module as a "later" item — company average, department average, norm
 * comparison). This function is written to be genuinely usable once that
 * data exists, but until then `norms` will typically be omitted and this
 * returns null rather than a fabricated number — the report/UI should
 * treat overallPercentile === null as "not enough data yet," not "0th
 * percentile."
 *
 * @param {number} overallScore
 * @param {number[]} [norms] - prior completed attempts' overallScores,
 *   e.g. pulled from assessment_results for the same assessmentId (or
 *   company/role/level cohort, however you want to scope the norm group)
 * @returns {number|null} percentile rank 0-100, or null if no norm data
 */
function calculatePercentile(overallScore, norms) {
  if (!Array.isArray(norms) || norms.length === 0) return null;

  const below = norms.filter((score) => score < overallScore).length;
  const equal = norms.filter((score) => score === overallScore).length;

  // Standard "mean percentile rank" formula — counts ties as half-in.
  const percentile = ((below + 0.5 * equal) / norms.length) * 100;
  return Math.round(percentile);
}

module.exports = { calculatePercentile };