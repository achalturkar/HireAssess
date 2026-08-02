'use strict';

const { prisma } = require('../../common/prisma');
const repo = require('./question.repository');

const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../../utils/errors');

/**
 * Convert Prisma entity to DTO
 */
const toDto = (question) => ({
  id: question.id,
  companyId: question.companyId,
  questionCode: question.questionCode,
  type: question.type,
  category: question.category,
  questionText: question.questionText,
  options: question.options,
  scoring: question.scoring,
  difficulty: question.difficulty,
  status: question.status,
  createdById: question.createdById,
  updatedById: question.updatedById,
  createdAt: question.createdAt,
  updatedAt: question.updatedAt,
});

/**
 * Validate the options/scoring shape against the question `type`.
 * Runs on both create and update (merged payload).
 */
const validateQuestionShape = ({ type, options, scoring }) => {
  if (type === 'LIKERT') {
    if (!scoring || typeof scoring.reverse !== 'boolean') {
      throw new BadRequestError(
        'LIKERT questions require scoring.reverse (boolean).'
      );
    }
    return;
  }

  if (
    type === 'FORCED_CHOICE' ||
    type === 'SITUATIONAL_JUDGEMENT' ||
    type === 'ANALYTICAL' ||
    type === 'LOGICAL_REASONING'
  ) {
    if (!Array.isArray(options) || options.length < 2) {
      throw new BadRequestError(
        `${type} questions require at least 2 options.`
      );
    }

    const ids = new Set();

    options.forEach((opt) => {
      if (!opt.id || !opt.text || typeof opt.score !== 'number') {
        throw new BadRequestError(
          'Each option requires id, text, and a numeric score.'
        );
      }

      if (ids.has(opt.id)) {
        throw new BadRequestError(
          `Duplicate option id "${opt.id}" found.`
        );
      }

      ids.add(opt.id);
    });

    return;
  }

  throw new BadRequestError('Unsupported question type.');
};

/**
 * Create Question
 */
const create = async ({ payload, currentUser }) => {
  const {
    companyId,
    questionCode,
    type,
    category,
    questionText,
    options,
    scoring,
    difficulty,
  } = payload;

  if (!companyId) {
    throw new BadRequestError('Company is required');
  }

  if (!questionCode) {
    throw new BadRequestError('Question code is required');
  }

  if (!type) {
    throw new BadRequestError('Question type is required');
  }

  if (!questionText) {
    throw new BadRequestError('Question text is required');
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

  // Type-specific payload validation
  validateQuestionShape({ type, options, scoring });

  // Duplicate Code inside Company
  const existingCode = await repo.findByCode(companyId, questionCode);

  if (existingCode) {
    throw new ConflictError('Question code already exists');
  }

  const question = await repo.create({
    companyId,
    questionCode,
    type,
    category,
    questionText,
    options: options || null,
    scoring: scoring || null,
    difficulty,
    status: 'ACTIVE',
    createdById: currentUser?.id || null,
  });

  return toDto(question);
};

/**
 * Get Question By Id
 */
const getById = async ({ id, companyId }) => {
  const question = await repo.findById(id, companyId);

  if (!question) {
    throw new NotFoundError('Question not found');
  }

  return toDto(question);
};

/**
 * List Questions
 */
const list = async ({ companyId, query }) => {
  const result = await repo.list({
    companyId,
    skip: query.skip,
    limit: query.limit,
    search: query.search,
    type: query.type,
    category: query.category,
    difficulty: query.difficulty,
    status: query.status,
    sortBy: [
      'questionCode',
      'type',
      'category',
      'difficulty',
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
 * Update Question
 */
const update = async ({ id, companyId, payload, currentUser }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  // Duplicate Question Code
  if (
    payload.questionCode &&
    payload.questionCode !== existing.questionCode
  ) {
    const duplicate = await repo.findByCode(
      companyId,
      payload.questionCode
    );

    if (duplicate && duplicate.id !== id) {
      throw new ConflictError('Question code already exists.');
    }
  }

  // Validate merged shape (type may or may not be changing)
  const mergedType = payload.type || existing.type;
  const mergedOptions =
    payload.options !== undefined ? payload.options : existing.options;
  const mergedScoring =
    payload.scoring !== undefined ? payload.scoring : existing.scoring;

  validateQuestionShape({
    type: mergedType,
    options: mergedOptions,
    scoring: mergedScoring,
  });

  const data = {};

  [
    'questionCode',
    'type',
    'category',
    'questionText',
    'options',
    'scoring',
    'difficulty',
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
 * Soft Delete Question
 */
const remove = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  await repo.softDelete(id);
};

/**
 * Activate Question
 */
const activate = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId, {
    includeDeleted: true,
  });

  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  if (existing.isDeleted) {
    throw new BadRequestError('Deleted question cannot be activated.');
  }

  if (existing.status === 'ACTIVE') {
    throw new BadRequestError('Question is already active.');
  }

  const updated = await repo.setStatus(id, 'ACTIVE');

  return toDto(updated);
};

/**
 * Inactivate Question
 */
const inactivate = async ({ id, companyId }) => {
  const existing = await repo.findById(id, companyId);

  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  if (existing.status === 'INACTIVE') {
    throw new BadRequestError('Question is already inactive.');
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