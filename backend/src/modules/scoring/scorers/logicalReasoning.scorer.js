'use strict';

/**
 * LOGICAL_REASONING scorer.
 *
 * Question shape (matches src/data/{entry,mid,top}/logical.json):
 *   {
 *     id, type: 'LOGICAL_REASONING',
 *     category,           // topic, e.g. "Enterprise Logic & Risk Deduction"
 *     scenario,
 *     options: [{ id, text, score }, ...]
 *   }
 * Answer shape:
 *   { selectedOptionId }
 *
 * Same topic + umbrella dual-contribution design as analytical.scorer.js
 * — see the comment there for the reasoning. Kept as a separate file
 * (rather than one shared "single-best-answer" scorer reused by both
 * types) on purpose: it's currently identical logic, but analytical and
 * logical reasoning items commonly diverge later (e.g. time-pressure
 * penalties, partial credit for logical questions with multiple valid
 * deduction paths) and the plugin architecture's whole point is that each
 * type owns its own scoring rules independently.
 */

const UMBRELLA_CATEGORY = 'Logical Reasoning';

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