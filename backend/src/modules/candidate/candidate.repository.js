'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Create Candidate
 */
const create = (data) =>
  prisma.candidate.create({
    data,
  });

/**
 * Find Candidate By ID
 */
const findById = (
  id,
  companyId,
  { includeDeleted = false } = {}
) =>
  prisma.candidate.findFirst({
    where: {
      id,
      companyId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
  });

/**
 * Find Candidate By Email within an Assessment
 * Used to prevent duplicate candidates on the same assessment.
 */
const findByEmail = (assessmentId, email) =>
  prisma.candidate.findFirst({
    where: {
      assessmentId,
      email: {
        equals: email,
        mode: 'insensitive',
      },
      isDeleted: false,
    },
  });

/**
 * Update Candidate
 */
const update = (id, data) =>
  prisma.candidate.update({
    where: { id },
    data,
  });

/**
 * Soft Delete
 */
const softDelete = (id) =>
  prisma.candidate.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

/**
 * Set Status
 */
const setStatus = (id, status) =>
  prisma.candidate.update({
    where: { id },
    data: { status },
  });

/**
 * List Candidates
 */
const list = async ({
  companyId,
  skip,
  limit,
  search,
  assessmentId,
  clientId,
  status,
  sortBy,
  sortOrder,
  includeDeleted,
}) => {
  const where = {
    companyId,

    ...(includeDeleted
      ? {}
      : {
          isDeleted: false,
        }),

    ...(assessmentId ? { assessmentId } : {}),

    ...(clientId ? { clientId } : {}),

    ...(status ? { status } : {}),

    ...(search
      ? {
          OR: [
            {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),

    prisma.candidate.count({
      where,
    }),
  ]);

  return {
    items,
    total,
  };
};

module.exports = {
  create,
  findById,
  findByEmail,
  update,
  softDelete,
  setStatus,
  list,
};