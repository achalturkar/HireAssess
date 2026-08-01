'use strict';

/**
 * Overall score is the simple mean of normalized category scores —
 * deliberately unweighted for now. If some competencies should count more
 * than others for a given assessment/role, that's a weight-per-category
 * config this function would need to accept; not implemented since no
 * weighting requirements were specified.
 */
function calculateOverall(categoryScores) {
  const values = Object.values(categoryScores);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / values.length);
}

/**
 * Recommendation bands, exactly per spec:
 *   90+     Outstanding
 *   80-89   Strong Fit
 *   70-79   Good Fit
 *   60-69   Potential Fit
 *   <60     Needs Development
 */
const BANDS = [
  { min: 90, label: 'Outstanding' },
  { min: 80, label: 'Strong Fit' },
  { min: 70, label: 'Good Fit' },
  { min: 60, label: 'Potential Fit' },
  { min: 0, label: 'Needs Development' },
];

function recommendationFor(overallScore) {
  const band = BANDS.find((b) => overallScore >= b.min);
  return band ? band.label : BANDS[BANDS.length - 1].label;
}

module.exports = { calculateOverall, recommendationFor };