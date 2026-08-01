'use strict';

/**
 * Splits category scores into top-3 "strengths" and bottom-3 "development
 * areas," per spec. With fewer than 6 categories total the two lists will
 * overlap in rank but never share a category (development areas are
 * excluded from strengths first).
 *
 * `advice` is an optional lookup — see src/data/developmentAdvice.json for
 * the shape — keyed by category name. Categories without an entry still
 * appear in developmentAreas, just without a `training` list, so a gap in
 * the advice file degrades gracefully instead of breaking scoring.
 *
 * `questionCounts` (from boundsCalculator) filters OUT low-sample-size
 * categories before ranking — a single analytical/logical scenario with a
 * unique topic-level category (e.g. "M&A Valuation Metrics", n=1) will
 * always score either 100 or 0 or somewhere on a coarse 4-point scale,
 * which reads as a dramatic "strength" or "development area" purely from
 * sample-size noise, not a real pattern. Umbrella categories like
 * "Analytical Reasoning" (which accumulate across every question of that
 * type) and genuine multi-question competencies stay eligible. If too few
 * categories clear the threshold to fill 3 slots, this backs off to
 * including everything rather than returning a suspiciously short list.
 */
function calculate(categoryScores, advice = {}, { questionCounts, minSampleSize = 2 } = {}) {
  let eligible = Object.entries(categoryScores);

  if (questionCounts) {
    const filtered = eligible.filter(([category]) => (questionCounts.get(category) || 0) >= minSampleSize);
    if (filtered.length >= 3) eligible = filtered;
    // else: not enough qualifying categories — fall back to the full set
    // rather than shipping a strengths list with 1 entry in it.
  }

  const entries = eligible.sort((a, b) => b[1] - a[1]);

  const strengths = entries.slice(0, 3).map(([category, score]) => ({ category, score }));

  const developmentAreas = entries
    .slice(-3)
    .reverse() // lowest first
    .map(([category, score]) => {
      const entry = advice[category];
      return {
        category,
        score,
        description: entry?.description ?? null,
        training: entry?.training ?? [],
      };
    });

  return { strengths, developmentAreas };
}

module.exports = { calculate };