'use strict';

const { prisma } = require('../../common/prisma');

/**
 * Create Invitation
 */
const create = (data) =>
  prisma.candidateInvitation.create({
    data,
  });

/**
 * Find Invitation By ID (scoped to company via the candidate relation —
 * invitation itself has no companyId column)
 */
const findById = (id, companyId) =>
  prisma.candidateInvitation.findFirst({
    where: {
      id,
      candidate: { companyId },
    },
    include: { candidate: true },
  });

/**
 * Find Invitation By Token
 * Public lookup — the token itself is the credential, so this is
 * intentionally not scoped by companyId.
 */
const findByToken = (token) =>
  prisma.candidateInvitation.findFirst({
    where: { token },
    include: { candidate: true },
  });

/**
 * Find the most recent non-terminal invitation for a candidate.
 * Used to block sending a second active invite on top of one already
 * SENT or STARTED.
 */
const findActiveByCandidate = (candidateId) =>
  prisma.candidateInvitation.findFirst({
    where: {
      candidateId,
      status: { in: ['SENT', 'STARTED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

/**
 * Update Invitation
 */
const update = (id, data) =>
  prisma.candidateInvitation.update({
    where: { id },
    data,
  });

/**
 * Set Status
 */
const setStatus = (id, status) =>
  prisma.candidateInvitation.update({
    where: { id },
    data: { status },
  });

/**
 * List Invitations
 */
const list = async ({
  companyId,
  candidateId,
  status,
  skip,
  limit,
  sortBy,
  sortOrder,
}) => {
  const where = {
    candidate: { companyId },
    ...(candidateId ? { candidateId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.candidateInvitation.findMany({
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
    prisma.candidateInvitation.count({ where }),
  ]);

  return { items, total };
};

module.exports = {
  create,
  findById,
  findByToken,
  findActiveByCandidate,
  update,
  setStatus,
  list,
};