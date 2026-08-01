'use strict';

/**
 * Assembles the final report payload. Kept deliberately flat and
 * JSON-serializable — this is exactly what gets stored in
 * assessment_results.report (JsonB) and consumed by both the PDF
 * generator and the admin/candidate dashboards.
 *
 * Includes both `recommendation` (per this spec's Outstanding/Strong
 * Fit/... bands) and a legacy `band` (High/Moderate/Low) so it stays
 * compatible with the earlier assessment-result frontend, which already
 * reads report.overall.band — drop `band` once that UI is updated to use
 * `recommendation` instead.
 */
function legacyBand(overallScore) {
  if (overallScore >= 80) return 'High';
  if (overallScore >= 50) return 'Moderate';
  return 'Low';
}

function build({
  overallScore,
  overallPercentile,
  recommendation,
  categoryScores,
  strengths,
  developmentAreas,
  unanswered,
}) {
  return {
    overall: {
      score: overallScore,
      percentile: overallPercentile,
      recommendation,
      band: legacyBand(overallScore), // see note above
    },
    categories: Object.entries(categoryScores).map(([category, score]) => ({
      category,
      score,
    })),
    strengths,
    developmentAreas,
    dataQuality: {
      unansweredQuestionIds: unanswered ?? [],
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { build };