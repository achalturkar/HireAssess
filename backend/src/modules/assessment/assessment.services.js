'use strict';

const { prisma } = require('../../common/prisma');
const repo = require('./assessment.repository');

const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../../utils/errors');

/**
 * Convert Prisma entity to DTO
 */
const toDto = (assessment) => ({
  id: assessment.id,
  companyId: assessment.companyId,
  clientId: assessment.clientId,
  name: assessment.name,
  level: assessment.level,
  likertCount: assessment.likertCount,
  sjqCount: assessment.sjqCount,
  forcedChoiceCount: assessment.forcedChoiceCount,
  durationMinutes: assessment.durationMinutes,
  status: assessment.status,
  createdById: assessment.createdById,
  updatedById: assessment.updatedById,
  createdAt: assessment.createdAt,
  updatedAt: assessment.updatedAt,
});

/**
 * An assessment with zero questions makes no sense.
 */
const assertHasQuestions = ({
  likertCount,
  sjqCount,
  forcedChoiceCount,
}) => {
  const total =
    (likertCount || 0) + (sjqCount || 0) + (forcedChoiceCount || 0);

  if (total <= 0) {
    throw new BadRequestError(
      'Assessment must include at least one question (likert, sjq, or forced choice).'
    );
  }
};

/**
 * Create Assessment
 */
const create = async ({ payload, currentUser }) => {
  const {
    companyId,
    clientId,
    name,
    level,
    likertCount,
    sjqCount,
    forcedChoiceCount,
    durationMinutes,
  } = payload;

  if (!companyId) {
    throw new BadRequestError('Company is required');
  }

  if (!clientId) {
    throw new BadRequestError('Client is required');
  }

  if (!name) {
    throw new BadRequestError('Assessment name is required');
  }

  if (!level) {
    throw new BadRequestError('Assessment level is required');
  }

  if (!durationMinutes) {
    throw new BadRequestError('Duration is required');
  }

  // Company validation
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      isDeleted: false,
    },
  });

  if (!company) {
    throw new NotFoundError('Company not found');
  }

  // Client validation - must belong to the same company
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

  assertHasQuestions({ likertCount, sjqCount, forcedChoiceCount });

  // Duplicate Name inside Client
  const existingName = await repo.findByName(companyId, clientId, name);

  if (existingName) {
    throw new ConflictError(
      'Assessment with same name already exists for this client.'
    );
  }

  const assessment = await repo.create({
    companyId,
    clientId,
    name,
    level,
    likertCount: likertCount || 0,
    sjqCount: sjqCount || 0,
    forcedChoiceCount: forcedChoiceCount || 0,
    durationMinutes,
    status: 'ACTIVE',
    createdById: currentUser?.id || null,
  });

  return toDto(assessment);
};

/**
 * Get Assessment By Id
 */
const getById = async ({ id, companyId }) => {
  const assessment = await repo.findById(id, companyId);

  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }

  return toDto(assessment);
};

/**
 * List Assessments
 */
const list = async ({ companyId, query }) => {
  const result = await repo.list({
    companyId,
    skip: query.skip,
    limit: query.limit,
    search: query.search,
    clientId: query.clientId,
    level: query.level,
    status: query.status,
    sortBy: [
      'name',
      'level',
      'durationMinutes',
      'status',
      'createdAt',
      'updatedAt',
    ].includes(query.sortBy)
      ? query.sortBy
      : 'createdAt',
    sortOrder: query.sortOrder,
    includeDeleted: query.includeDeleted === 'true',
  });

  return {
    items: result.items.map(toDto),
    total: result.total,
  };
};

/**
 * Update Assessment
 */
const update = async ({ id, companyId, payload, currentUser }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Assessment not found');
  }

  // If moving to a different client, validate it belongs to this company
  if (payload.clientId && payload.clientId !== existing.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: payload.clientId,
        companyId,
        isDeleted: false,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }
  }

  // Duplicate Name inside (possibly new) Client
  if (payload.name && payload.name !== existing.name) {
    const targetClientId = payload.clientId || existing.clientId;

    const duplicate = await repo.findByName(
      companyId,
      targetClientId,
      payload.name
    );

    if (duplicate && duplicate.id !== id) {
      throw new ConflictError(
        'Assessment with same name already exists for this client.'
      );
    }
  }

  // Validate merged question counts
  assertHasQuestions({
    likertCount:
      payload.likertCount !== undefined
        ? payload.likertCount
        : existing.likertCount,
    sjqCount:
      payload.sjqCount !== undefined
        ? payload.sjqCount
        : existing.sjqCount,
    forcedChoiceCount:
      payload.forcedChoiceCount !== undefined
        ? payload.forcedChoiceCount
        : existing.forcedChoiceCount,
  });

  const data = {};

  [
    'clientId',
    'name',
    'level',
    'likertCount',
    'sjqCount',
    'forcedChoiceCount',
    'durationMinutes',
    'status',
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = payload[field];
    }
  });

  data.updatedById = currentUser?.id || null;

  const updated = await repo.update(id, data);

  return toDto(updated);
};

/**
 * Soft Delete Assessment
 */
const remove = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Assessment not found');
  }

  await repo.softDelete(id);
};

/**
 * Activate Assessment
 */
const activate = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId, {
    includeDeleted: true,
  });

  if (!existing) {
    throw new NotFoundError('Assessment not found');
  }

  if (existing.isDeleted) {
    throw new BadRequestError('Deleted assessment cannot be activated.');
  }

  if (existing.status === 'ACTIVE') {
    throw new BadRequestError('Assessment is already active.');
  }

  const updated = await repo.setStatus(id, 'ACTIVE');

  return toDto(updated);
};

/**
 * Inactivate Assessment
 */
const inactivate = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Assessment not found');
  }

  if (existing.status === 'INACTIVE') {
    throw new BadRequestError('Assessment is already inactive.');
  }

  const updated = await repo.setStatus(id, 'INACTIVE');

  return toDto(updated);
};

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  activate,
  inactivate,
};