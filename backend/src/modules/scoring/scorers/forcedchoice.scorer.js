'use strict';

/**
 * FORCED_CHOICE scorer.
 *
 * Question shape assumed (matches your fc-bank JSON):
 *   { id, type: 'FORCED_CHOICE', items: [{ id, category, text }, ...] }
 *   (your data currently always has exactly 4 items per block, but nothing
 *   here hard-codes that number)
 * Answer shape:
 *   { mostLikeId, leastLikeId }
 *
 * SCORING CONVENTION — this is a judgment call, flag it for review:
 * Classic ipsative forced-choice scoring gives +1 to the "most like me"
 * trait and -1 to "least like me," with unpicked items at 0. That produces
 * negative category totals, which is awkward to normalize onto a clean
 * 0-100 scale alongside Likert/SJQ.
 *
 * Instead this uses a "partially ipsative," always-non-negative scheme:
 *   most-like item's category   -> 2 points
 *   least-like item's category  -> 0 points
 *   the two unpicked items      -> 1 point each (neutral)
 * Every item's category gets *some* points on every block it appears in,
 * with a max of 2 per appearance — that's what boundsCalculator uses to
 * normalize. If you specifically need classic ipsative (+1/-1/0) scoring
 * for psychometric comparability with an existing norm group, swap the
 * POINTS_FOR constants below and switch categoryAggregator's normalization
 * to shift the range instead of clamping at zero.
 */

const POINTS_FOR = {
  most: 2,
  neutral: 1,
  least: 0,
};
const MAX_POINTS_PER_ITEM = POINTS_FOR.most;

function score(question, answer) {
  const items = Array.isArray(question.items) ? question.items : [];
  const mostId = answer?.mostLikeId ?? null;
  const leastId = answer?.leastLikeId ?? null;

  if (items.length === 0 || !mostId || !leastId) {
    return { raw: null, contributions: [] };
  }

  const contributions = items.map((item) => {
    let points = POINTS_FOR.neutral;
    if (item.id === mostId) points = POINTS_FOR.most;
    else if (item.id === leastId) points = POINTS_FOR.least;

    return { category: item.category, points, maxPoints: MAX_POINTS_PER_ITEM };
  });

  // No single number fully represents an ipsative block's result (it's
  // inherently multi-category), but the "most like me" pick is the closest
  // thing to a headline value — store that for CandidateAnswer.score.
  return { raw: POINTS_FOR.most, contributions };
}

function possibleContributions(question) {
  const items = Array.isArray(question.items) ? question.items : [];
  return items.map((item) => ({
    category: item.category,
    minPoints: POINTS_FOR.least,
    maxPoints: MAX_POINTS_PER_ITEM,
  }));
}

module.exports = { score, possibleContributions };