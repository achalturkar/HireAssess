'use strict';

const { prisma } = require('../../common/prisma');
const repo = require('./candidate.repository');

const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../../utils/errors');

/**
 * Convert Prisma entity to DTO
 */
const toDto = (candidate) => ({
  id: candidate.id,
  companyId: candidate.companyId,
  assessmentId: candidate.assessmentId,
  clientId: candidate.clientId,
  firstName: candidate.firstName,
  lastName: candidate.lastName,
  email: candidate.email,
  phone: candidate.phone,
  status: candidate.status,
  createdById: candidate.createdById,
  updatedById: candidate.updatedById,
  createdAt: candidate.createdAt,
  updatedAt: candidate.updatedAt,
});

/**
 * States a candidate can no longer move out of.
 */
const TERMINAL_STATUSES = ['COMPLETED', 'WITHDRAWN'];

const assertNotTerminal = (candidate) => {
  if (TERMINAL_STATUSES.includes(candidate.status)) {
    throw new BadRequestError(
      `Candidate is already ${candidate.status.toLowerCase()} and cannot be updated further.`
    );
  }
};

/**
 * Create Candidate
 */
const create = async ({ payload, companyId, currentUser }) => {
  const { assessmentId, clientId, firstName, lastName, email, phone } =
    payload;

  if (!assessmentId) {
    throw new BadRequestError('Assessment is required');
  }

  if (!clientId) {
    throw new BadRequestError('Client is required');
  }

  if (!firstName || !lastName) {
    throw new BadRequestError('First name and last name are required');
  }

  if (!email) {
    throw new BadRequestError('Email is required');
  }

  // Client validation - must belong to the company
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      companyId,
      isDeleted: false,
    },
  });

  if (!client) {
    throw new NotFoundError('Client not found');
  }

  // Assessment validation - must belong to the company AND the same client
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      companyId,
      isDeleted: false,
    },
  });

  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }

  if (assessment.clientId !== clientId) {
    throw new BadRequestError(
      'Assessment does not belong to the given client.'
    );
  }

  // Duplicate candidate on the same assessment
  const existing = await repo.findByEmail(assessmentId, email);

  if (existing) {
    throw new ConflictError(
      'A candidate with this email is already on this assessment.'
    );
  }

  const candidate = await repo.create({
    companyId,
    assessmentId,
    clientId,
    firstName,
    lastName,
    email,
    phone,
    status: 'INVITED',
    createdById: currentUser?.id || null,
  });

  return toDto(candidate);
};

/**
 * Get Candidate By Id
 */
const getById = async ({ id, companyId }) => {
  const candidate = await repo.findById(id, companyId);

  if (!candidate) {
    throw new NotFoundError('Candidate not found');
  }

  return toDto(candidate);
};

/**
 * List Candidates
 */
const list = async ({ companyId, query }) => {
  const result = await repo.list({
    companyId,
    skip: query.skip,
    limit: query.limit,
    search: query.search,
    assessmentId: query.assessmentId,
    clientId: query.clientId,
    status: query.status,
    sortBy: [
      'firstName',
      'lastName',
      'email',
      'status',
      'createdAt',
      'updatedAt',
    ].includes(query.sortBy)
      ? query.sortBy
      : 'createdAt',
    sortOrder: ['asc', 'desc'].includes(query.sortOrder) ? query.sortOrder : 'desc',
    includeDeleted: query.includeDeleted === 'true',
  });

  return {
    items: result.items.map(toDto),
    total: result.total,
  };
};

/**
 * Update Candidate
 * (contact details only - status changes go through the dedicated
 * start / complete / expire / withdraw transitions below)
 */
const update = async ({ id, companyId, payload, currentUser }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Candidate not found');
  }

  // Duplicate email on the same assessment
  if (payload.email && payload.email !== existing.email) {
    const duplicate = await repo.findByEmail(
      existing.assessmentId,
      payload.email
    );

    if (duplicate && duplicate.id !== id) {
      throw new ConflictError(
        'A candidate with this email is already on this assessment.'
      );
    }
  }

  if (payload.status && payload.status !== existing.status) {
    // Allow direct status writes too, but keep the same terminal guard
    assertNotTerminal(existing);
  }

  const data = {};

  ['firstName', 'lastName', 'email', 'phone', 'status'].forEach(
    (field) => {
      if (payload[field] !== undefined) {
        data[field] = payload[field];
      }
    }
  );

  data.updatedById = currentUser?.id || null;

  const updated = await repo.update(id, data);

  return toDto(updated);
};

/**
 * Soft Delete Candidate
 */
const remove = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Candidate not found');
  }

  await prisma.candidateInvitation.updateMany({
    where: {
      candidateId: id,
      status: {
        in: ['SENT', 'STARTED'],
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  await repo.softDelete(id);
};

/**
 * Start Assessment (INVITED -> IN_PROGRESS)
 */
const start = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Candidate not found');
  }

  assertNotTerminal(existing);

  if (existing.status === 'IN_PROGRESS') {
    throw new BadRequestError('Candidate has already started.');
  }

  const updated = await repo.setStatus(id, 'IN_PROGRESS');

  return toDto(updated);
};

/**
 * Complete Assessment (-> COMPLETED)
 */
const complete = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Candidate not found');
  }

  assertNotTerminal(existing);

  const updated = await repo.setStatus(id, 'COMPLETED');

  return toDto(updated);
};

/**
 * Expire Invitation (-> EXPIRED)
 */
const expire = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Candidate not found');
  }

  assertNotTerminal(existing);

  if (existing.status === 'EXPIRED') {
    throw new BadRequestError('Candidate is already expired.');
  }

  const updated = await repo.setStatus(id, 'EXPIRED');

  return toDto(updated);
};

/**
 * Withdraw Candidate (-> WITHDRAWN)
 */
const withdraw = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Candidate not found');
  }

  assertNotTerminal(existing);

  const updated = await repo.setStatus(id, 'WITHDRAWN');

  return toDto(updated);
};

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  start,
  complete,
  expire,
  withdraw,
};