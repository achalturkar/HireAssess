'use strict';

/**
 * SITUATIONAL_JUDGEMENT (SJQ) scorer.
 *
 * Question shape assumed:
 *   {
 *     id, type: 'SITUATIONAL_JUDGEMENT', category,
 *     scenario,
 *     options: [{ id, text, category?, score? }, ...]
 *   }
 * Answer shape:
 *   { selectedOptionId }
 *
 * ASSUMPTION (flag this against your real question bank): each option may
 * optionally carry its own `category`, overriding the question's category —
 * this matches the SjqOption type in your frontend. If your SJQ items are
 * always single-category (one competency per scenario), option.category
 * will simply be undefined and everything falls back to question.category,
 * which is the common case handled below.
 *
 * If a single scenario is genuinely multi-dimensional (some options score
 * against Leadership, others against Communication, etc.), the bounds
 * calculation below (possibleContributions) approximates the category's
 * max/min contribution as the max/min score among *that category's*
 * options only — reasonable, but worth a second look once real SJQ data
 * exists.
 */

function getSelectedOptionId(answer) {
  return answer?.selectedOptionId ?? answer?.selectedOption ?? null;
}

function score(question, answer) {
  const selectedId = getSelectedOptionId(answer);
  if (!selectedId) return { raw: null, contributions: [] };

  const options = Array.isArray(question.options) ? question.options : [];
  const selected = options.find((o) => o.id === selectedId);
  if (!selected) return { raw: null, contributions: [] };

  const category = selected.category || question.category;
  const points = typeof selected.score === 'number' ? selected.score : 0;
  const maxPoints = Math.max(0, ...options.map((o) => (typeof o.score === 'number' ? o.score : 0)));

  return {
    raw: points,
    contributions: [{ category, points, maxPoints }],
  };
}

function possibleContributions(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length === 0) return [];

  // Group options by the category they actually score against, then take
  // that group's min/max score — see the multi-dimensional-SJQ note above.
  const byCategory = new Map();
  for (const opt of options) {
    const category = opt.category || question.category;
    const optScore = typeof opt.score === 'number' ? opt.score : 0;
    const bucket = byCategory.get(category) || [];
    bucket.push(optScore);
    byCategory.set(category, bucket);
  }

  return Array.from(byCategory.entries()).map(([category, scores]) => ({
    category,
    minPoints: Math.min(...scores),
    maxPoints: Math.max(...scores),
  }));
}

module.exports = { score, possibleContributions };