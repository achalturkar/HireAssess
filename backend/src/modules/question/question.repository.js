'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Create Question
 */
const create = (data) =>
  prisma.questionBank.create({
    data,
  });

/**
 * Find Question By ID
 */
const findById = (
  id,
  companyId,
  { includeDeleted = false } = {}
) =>
  prisma.questionBank.findFirst({
    where: {
      id,
      companyId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
  });

/**
 * Find Question By Code
 * Used to prevent duplicate question codes within same company.
 */
const findByCode = (companyId, questionCode) =>
  prisma.questionBank.findFirst({
    where: {
      companyId,
      questionCode: {
        equals: questionCode,
        mode: 'insensitive',
      },
      isDeleted: false,
    },
  });

/**
 * Update Question
 */
const update = (id, data) =>
  prisma.questionBank.update({
    where: { id },
    data,
  });

/**
 * Soft Delete
 */
const softDelete = (id) =>
  prisma.questionBank.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'INACTIVE',
    },
  });

/**
 * Activate / Inactivate
 */
const setStatus = (id, status) =>
  prisma.questionBank.update({
    where: { id },
    data: { status },
  });

/**
 * List Questions
 */
const list = async ({
  companyId,
  skip,
  limit,
  search,
  type,
  category,
  difficulty,
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

    ...(type ? { type } : {}),

    ...(category
      ? {
          category: {
            equals: category,
            mode: 'insensitive',
          },
        }
      : {}),

    ...(difficulty ? { difficulty } : {}),

    ...(status ? { status } : {}),

    ...(search
      ? {
          OR: [
            {
              questionText: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              questionCode: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.questionBank.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),

    prisma.questionBank.count({
      where,
    }),
  ]);

  return {
    items,
    total,
  };
};

/**
 * Get Questions By IDs
 */
const findManyByIds = (companyId, ids) =>
  prisma.questionBank.findMany({
    where: {
      companyId,
      id: {
        in: ids,
      },
      isDeleted: false,
    },
  });

module.exports = {
  create,
  findById,
  findByCode,
  update,
  softDelete,
  setStatus,
  list,
    findManyByIds,

};