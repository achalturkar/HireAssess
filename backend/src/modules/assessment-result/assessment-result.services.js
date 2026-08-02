'use strict';

const { prisma } = require('../../common/prisma');

// Adjust these paths to wherever your modules actually live
const candidateAnswerRepo = require('../candidate-answer/candidate-answer.repository');
const repo = require('./assessment-result.repository');
const answerRepo = require("../candidate-answer/candidate-answer.repository");
const loader = require("../question/question.loader");
const attemptRepo = require("../exam-attempt/exam-attempt.repository");

const { NotFoundError } = require('../../utils/errors');
const logger = require('../../common/logger');

const toDto = (row) => ({
  id: row.id,
  attemptId: row.attemptId,
  overallScore: row.overallScore,
  traitScores: row.traitScores,
  report: row.report,
  createdAt: row.createdAt,
  candidate: row.attempt?.candidate
    ? {
        id: row.attempt.candidate.id,
        firstName: row.attempt.candidate.firstName,
        lastName: row.attempt.candidate.lastName,
        email: row.attempt.candidate.email,
      }
    : undefined,
  assessment: row.attempt?.assessment
    ? {
        id: row.attempt.assessment.id,
        name: row.attempt.assessment.name,
        level: row.attempt.assessment.level,
        durationMinutes: row.attempt.assessment.durationMinutes,
      }
    : undefined,
});

/**
 * ------------------------------------------------------------------
 * SCAFFOLD — replace with your real trait-weighting scheme.
 *
 * Assumes a QuestionTrait join table: { questionId, trait, weight }
 * mapping each question to one or more traits with a contribution
 * weight (e.g. question "lk12" contributes weight 1.0 to "Leadership"
 * and 0.5 to "Decision Making"). Adjust the model/field names to match
 * your actual schema — this is a plausible shape, not a known one.
 *
 * Also assumes each CandidateAnswer.score has already been normalized
 * onto a common raw scale (RAW_SCALE_MAX below) by the scoring logic
 * in candidate-answer.services.js. If your raw scale differs per
 * question type, normalize per-answer before aggregating instead of
 * using one global constant.
 * ------------------------------------------------------------------
 */
const RAW_SCALE_MAX = 5; // e.g. a 1–5 likert scale — adjust to your real scale

const scoreBand = (value) => {
  if (value >= 80) return 'High';
  if (value >= 50) return 'Moderate';
  return 'Low';
};

const scoreStage = (value) => {
  if (value >= 90) return 'Outstanding';
  if (value >= 80) return 'Strong Fit';
  if (value >= 70) return 'Good Fit';
  if (value >= 60) return 'Potential Fit';
  return 'Needs Development';
};

const computeTraitScores = async (answers) => {
  const scoredAnswers = answers.filter((a) => a.score !== null && a.score !== undefined);
  if (!scoredAnswers.length) return {};

  const totals = {}; // trait -> { weightedSum, weightSum }

  for (const answer of scoredAnswers) {
    const question = loader.getQuestionById(answer.questionId);
    const trait = question?.category || answer.category || 'General';
    const weight = typeof question?.weight === 'number' ? question.weight : 1;
    const normalized = (Number(answer.score) / RAW_SCALE_MAX) * 100;

    totals[trait] ||= { weightedSum: 0, weightSum: 0 };
    totals[trait].weightedSum += normalized * weight;
    totals[trait].weightSum += weight;
  }

  const traitScores = {};
  for (const [trait, { weightedSum, weightSum }] of Object.entries(totals)) {
    if (weightSum > 0) {
      traitScores[trait] = Math.round(weightedSum / weightSum);
    }
  }

  return traitScores;
};

const computeOverallScore = (traitScores, answers) => {
  const values = Object.values(traitScores);
  if (!values.length) {
    const scoredAnswers = answers.filter((a) => a.score !== null && a.score !== undefined);
    if (!scoredAnswers.length) return 0;
    const average = scoredAnswers.reduce((sum, answer) => sum + Number(answer.score || 0), 0) / scoredAnswers.length;
    return Math.round((average / RAW_SCALE_MAX) * 100);
  }

  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

const buildReport = ({ overallScore, traitScores }) => ({
  overall: { score: overallScore, band: scoreBand(overallScore), stage: scoreStage(overallScore) },
  traits: Object.entries(traitScores).map(([trait, score]) => ({
    trait,
    score,
    band: scoreBand(score),
    stage: scoreStage(score),
  })),
  // TODO: replace with real narrative copy, e.g. per-band interpretation
  // text pulled from a template table, or an LLM-generated summary.
  generatedAt: new Date().toISOString(),
});

/**
 * Generate (or regenerate) a Result for a given attempt.
 * Idempotent via repo.upsert — safe to call more than once for the
 * same attempt (e.g. if scoring keys change and you want to reprocess).
 */
const generateForAttempt = async ({ attemptId }) => {
  // Load all saved answers for this attempt (only answered questions)
  const savedAnswers = await candidateAnswerRepo.listByAttempt(attemptId);

  // Load the attempt so we can iterate all selected questions
  const attempt = await attemptRepo.findById(attemptId);

  // Build a full answer list that includes unanswered questions as score=0
  // This ensures trait and overall calculations treat missing answers as zero
  const savedByQuestion = Object.fromEntries((savedAnswers || []).map((a) => [a.questionId, a]));
  const fullAnswers = [];
  for (const type of Object.keys(attempt.selectedQuestions || {})) {
    for (const qid of attempt.selectedQuestions[type]) {
      const existing = savedByQuestion[qid];
      if (existing) {
        fullAnswers.push(existing);
      } else {
        // mirror the CandidateAnswer shape minimally for aggregation
        fullAnswers.push({ questionId: qid, score: 0, answer: null, category: null });
      }
    }
  }

  const traitScores = await computeTraitScores(fullAnswers);
  const overallScore = computeOverallScore(traitScores, fullAnswers);
  const report = buildReport({ overallScore, traitScores });

  const saved = await repo.upsert({
    attemptId,
    overallScore,
    traitScores,
    report,
  });

  return toDto(saved);
};

/**
 * Best-effort wrapper for calling from exam-attempt's submit flow.
 * Never throws — a scoring failure shouldn't block the candidate's
 * submission from succeeding.
 */
const generateForAttemptSafe = async ({ attemptId }) => {
  try {
    await generateForAttempt({ attemptId });
  } catch (err) {
    logger.error(`Could not generate result for attempt ${attemptId}: ${err.stack || err.message}`);
  }
};

/**
 * Get Result — admin
 */
const getById = async ({ id, companyId }) => {
  const row = await repo.findById(id, companyId);
  if (!row) {
    throw new NotFoundError('Result not found');
  }
  return toDto(row);
};

/**
 * Get Result By Attempt — admin
 */
const getByAttemptId = async ({ attemptId, companyId }) => {
  const row = await repo.findByAttemptId(attemptId, companyId);
  if (!row) {
    throw new NotFoundError('Result not found for this attempt');
  }
  return toDto(row);
};

/**
 * List Results — admin
 */
const list = async ({ companyId, query }) => {
  const result = await repo.list({
    companyId,
    candidateId: query.candidateId,
    assessmentId: query.assessmentId,
    minScore: query.minScore,
    maxScore: query.maxScore,
    skip: query.skip,
    limit: query.limit,
    sortBy: ['overallScore', 'createdAt'].includes(query.sortBy) ? query.sortBy : 'createdAt',
    sortOrder: query.sortOrder,
  });

  return {
    items: result.items.map(toDto),
    total: result.total,
  };
};

const getCandidateResult = async ({
    attemptId,
    companyId,
}) => {

    const result =
        await repo.findByAttemptId(
            attemptId,
            companyId
        );

    if (!result) {
        throw new NotFoundError(
            "Result not found"
        );
    }

    const answers =
        await answerRepo.listByAttempt(
            attemptId
        );

    const answerMap = {};

    answers.forEach(a => {
        answerMap[a.questionId] = a;
    });

    const attempt =
        await attemptRepo.findById(
            attemptId,
            companyId
        );

    const questions = [];

    for (const type of Object.keys(attempt.selectedQuestions)) {
        for (const id of attempt.selectedQuestions[type]) {
            const q = loader.getQuestionById(id);
            questions.push({
                question: q ? { ...q, type } : null,
                answer: answerMap[id] || null,
            });
        }
    }

    return {

        candidate:
            result.attempt.candidate,

        assessment:
            result.attempt.assessment,

        startedAt:
            attempt.startedAt,

        submittedAt:
            attempt.submittedAt,

        overallScore:
            result.overallScore,

        traitScores:
            result.traitScores,

        report:
            result.report,

        questions

    };

};

module.exports = {

    generateForAttempt,

    generateForAttemptSafe,

    getById,

    getByAttemptId,

    getCandidateResult,

    list,

};
