'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Create Attempt
 */
const create = (data) =>
  prisma.examAttempt.create({
    data,
  });

/**
 * Find Attempt By ID (company-scoped, for admin views)
 */
const findById = (id, companyId) =>
  prisma.examAttempt.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      candidate: true,
      assessment: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          level: true,
        },
      },
    },
  });

/**
 * Find Attempt By Candidate + Assessment
 * Used to make attempt creation idempotent: if one already exists for
 * this candidate/assessment pair, it's resumed instead of recreated,
 * so selectedQuestions never changes mid-attempt.
 */
const findByCandidateAndAssessment = (candidateId, assessmentId) =>
  prisma.examAttempt.findFirst({
    where: { candidateId, assessmentId },
  });

/**
 * Update Attempt
 */
const update = (id, data) =>
  prisma.examAttempt.update({
    where: { id },
    data,
  });

/**
 * Set Status
 */
const setStatus = (id, status) =>
  prisma.examAttempt.update({
    where: { id },
    data: { status },
  });

/**
 * List Attempts
 */
const list = async ({
  companyId,
  candidateId,
  assessmentId,
  status,
  skip,
  limit,
  sortBy,
  sortOrder,
}) => {
  const where = {
    companyId,
    ...(candidateId ? { candidateId } : {}),
    ...(assessmentId ? { assessmentId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.examAttempt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.examAttempt.count({ where }),
  ]);

  return { items, total };
};

const findQuestions = (ids) =>
  prisma.questionBank.findMany({
    where: {
      id: {
        in: ids,
      },
      isDeleted: false,
      status: 'ACTIVE',
    },
  });

/**
* Get Questions By Ids
*/
const findQuestionsByIds = (ids) =>
  prisma.questionBank.findMany({
    where: {
      id: {
        in: ids,
      },
      isDeleted: false,
    },
    select: {
      id: true,
      questionCode: true,
      type: true,
      category: true,
      questionText: true,
      options: true,
      difficulty: true,
    },
  });



module.exports = {
  create,
  findById,
  findByCandidateAndAssessment,
  update,
  setStatus,
  list,
  findQuestions,
};