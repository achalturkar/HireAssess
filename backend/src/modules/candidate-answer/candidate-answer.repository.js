'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Upsert an Answer
 * One row per (attemptId, questionId) — resubmitting the same question
 * updates the existing answer rather than creating a duplicate.
 */
const upsert = ({ attemptId, questionId, questionType, category, answer, score }) =>
  prisma.candidateAnswer.upsert({
    where: {
      attemptId_questionId: { attemptId, questionId },
    },
    update: {
      questionType,
      category,
      answer,
      score,
    },
    create: {
      attemptId,
      questionId,
      questionType,
      category,
      answer,
      score,
    },
  });

/**
 * Find Answer By ID (company-scoped via the attempt relation)
 */
const findById = (id, companyId) =>
  prisma.candidateAnswer.findFirst({
    where: {
      id,
      attempt: { companyId },
    },
  });

/**
 * List all Answers for a single Attempt (used for token-based resume)
 */
const listByAttempt = (attemptId) =>
  prisma.candidateAnswer.findMany({
    where: { attemptId },
    orderBy: { createdAt: 'asc' },
  });

/**
 * List Answers — admin
 */
const list = async ({ companyId, attemptId, category, questionType, skip, limit, sortBy, sortOrder }) => {
  const where = {
    attempt: { companyId },
    ...(attemptId ? { attemptId } : {}),
    ...(category ? { category } : {}),
    ...(questionType ? { questionType } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.candidateAnswer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.candidateAnswer.count({ where }),
  ]);

  return { items, total };
};

/**
 * Count answered questions
 */
const countByAttempt = (attemptId) =>
  prisma.candidateAnswer.count({
    where: {
      attemptId,
    },
  });

module.exports = {
  upsert,
  findById,
  listByAttempt,
  list,
  countByAttempt,
};