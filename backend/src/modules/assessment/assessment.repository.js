'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Create Assessment
 */
const create = (data) =>
  prisma.assessment.create({
    data,
  });

/**
 * Find Assessment By ID
 */
const findById = (
  id,
  companyId,
  { includeDeleted = false } = {}
) =>
  prisma.assessment.findFirst({
    where: {
      id,
      companyId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
  });

/**
 * Find Assessment By Name
 * Used to prevent duplicate assessment names within same client.
 */
const findByName = (companyId, clientId, name) =>
  prisma.assessment.findFirst({
    where: {
      companyId,
      clientId,
      name: {
        equals: name,
        mode: 'insensitive',
      },
      isDeleted: false,
    },
  });

/**
 * Update Assessment
 */
const update = (id, data) =>
  prisma.assessment.update({
    where: { id },
    data,
  });

/**
 * Soft Delete
 */
const softDelete = (id) =>
  prisma.assessment.update({
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
  prisma.assessment.update({
    where: { id },
    data: { status },
  });

/**
 * List Assessments
 */
const list = async ({
  companyId,
  skip,
  limit,
  search,
  clientId,
  level,
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

    ...(clientId ? { clientId } : {}),

    ...(level ? { level } : {}),

    ...(status ? { status } : {}),

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),

    prisma.assessment.count({
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
  findByName,
  update,
  softDelete,
  setStatus,
  list,
};