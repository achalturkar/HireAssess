'use strict';

/**
 * ANALYTICAL scorer.
 *
 * Question shape (matches src/data/{entry,mid,top}/analytical.json):
 *   {
 *     id, type: 'ANALYTICAL',
 *     category,           // a specific topic, e.g. "M&A Valuation Metrics" —
 *                          // NOT one of the 10 behavioral competencies, and
 *                          // usually unique per question rather than shared
 *     scenario,
 *     options: [{ id, text, score }, ...]
 *   }
 * Answer shape:
 *   { selectedOptionId }   // matches option.id, e.g. "a" | "b" | "c" | "d"
 *
 * DESIGN DECISION: because `category` here is topic-level and typically
 * unique per question, scoring purely against `question.category` would
 * produce a sea of single-question "categories" — not a usable Analytical
 * Reasoning score. So every answer contributes to TWO buckets:
 *   1. `question.category`     — the specific topic, for question-level
 *                                 review / question-review tables
 *   2. UMBRELLA_CATEGORY        — every analytical question ever answered,
 *                                 rolled into one score that sits in the
 *                                 same flat categoryScores dict as
 *                                 "Leadership & Influence" etc. and shows
 *                                 up on the same radar/bar dashboard
 * If you'd rather these stay fully separate from the competency report
 * (e.g. a distinct "cognitive ability" section), drop the umbrella
 * contribution and aggregate `questionType === 'ANALYTICAL'` separately
 * upstream instead — but that requires the caller to know about types,
 * which this module otherwise deliberately doesn't.
 */

const UMBRELLA_CATEGORY = 'Analytical Reasoning';

function score(question, answer) {
  const selectedId = answer?.selectedOptionId ?? null;
  if (!selectedId) return { raw: null, contributions: [] };

  const options = Array.isArray(question.options) ? question.options : [];
  const selected = options.find((o) => o.id === selectedId);
  if (!selected) return { raw: null, contributions: [] };

  const points = typeof selected.score === 'number' ? selected.score : 0;
  const maxPoints = Math.max(0, ...options.map((o) => (typeof o.score === 'number' ? o.score : 0)));

  return {
    raw: points,
    contributions: [
      { category: question.category, points, maxPoints },
      { category: UMBRELLA_CATEGORY, points, maxPoints },
    ],
  };
}

function possibleContributions(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length === 0) return [];

  const scores = options.map((o) => (typeof o.score === 'number' ? o.score : 0));
  const minPoints = Math.min(...scores);
  const maxPoints = Math.max(...scores);

  return [
    { category: question.category, minPoints, maxPoints },
    { category: UMBRELLA_CATEGORY, minPoints, maxPoints },
  ];
}

module.exports = { score, possibleContributions, UMBRELLA_CATEGORY };