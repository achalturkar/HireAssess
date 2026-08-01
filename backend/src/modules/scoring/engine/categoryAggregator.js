'use strict';

/**
 * Sums the raw {category, points} contributions produced by scoringEngine,
 * then normalizes each category's total onto a 0-100 scale using the
 * min/max bounds from boundsCalculator.
 *
 * normalized = ((raw - min) / (max - min)) * 100, clamped to [0, 100].
 *
 * A category with max === min (a single question, or a degenerate bank)
 * would divide by zero — treated as 0 rather than throwing, since that's
 * a data problem worth surfacing in QA, not a reason to crash scoring.
 */
function aggregate(contributions, bounds) {
  const rawTotals = new Map(); // category -> summed points

  for (const { category, points } of contributions) {
    rawTotals.set(category, (rawTotals.get(category) || 0) + points);
  }

  const categoryScores = {};
  const categoryRaw = {};

  for (const [category, raw] of rawTotals.entries()) {
    categoryRaw[category] = raw;

    const bound = bounds.get(category);
    if (!bound || bound.max === bound.min) {
      categoryScores[category] = 0;
      continue;
    }

    const normalized = ((raw - bound.min) / (bound.max - bound.min)) * 100;
    categoryScores[category] = Math.round(Math.max(0, Math.min(100, normalized)));
  }

  return { categoryScores, categoryRaw };
}

module.exports = { aggregate };