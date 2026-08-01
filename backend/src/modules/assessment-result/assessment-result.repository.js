
'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Upsert a Result
 * attemptId is unique — regenerating a result (e.g. after a scoring key
 * change) overwrites the existing row rather than creating a duplicate.
 * createdAt is left untouched on update since Prisma only applies
 * @default(now()) at creation time.
 */
const upsert = ({ attemptId, overallScore, traitScores, report }) =>
  prisma.assessmentResult.upsert({
    where: { attemptId },
    update: { overallScore, traitScores, report },
    create: { attemptId, overallScore, traitScores, report },
  });

/**
 * Find Result By ID (company-scoped via the attempt relation)
 */
const findById = (id, companyId) =>
  prisma.assessmentResult.findFirst({
    where: {
      id,
      attempt: { companyId },
    },
    include: {
      attempt: {
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

/**
 * Find Result By Attempt ID (company-scoped)
 */
const findByAttemptId = (attemptId, companyId) =>
  prisma.assessmentResult.findFirst({
    where: {
      attemptId,
      attempt: { companyId },
    },
    include: {
      attempt: {
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

/**
 * List Results — admin
 */
const list = async ({
  companyId,
  candidateId,
  assessmentId,
  minScore,
  maxScore,
  skip,
  limit,
  sortBy,
  sortOrder,
}) => {
  const where = {
    attempt: {
      companyId,
      ...(candidateId ? { candidateId } : {}),
      ...(assessmentId ? { assessmentId } : {}),
    },
    ...(minScore !== undefined || maxScore !== undefined
      ? {
          overallScore: {
            ...(minScore !== undefined ? { gte: minScore } : {}),
            ...(maxScore !== undefined ? { lte: maxScore } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.assessmentResult.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        attempt: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    }),
    prisma.assessmentResult.count({ where }),
  ]);

  return { items, total };
};

module.exports = {
  upsert,
  findById,
  findByAttemptId,
  list,
};
