'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

const service = require('./question.service');

/**
 * Create Question
 */
const createQuestion = asyncHandler(async (req, res) => {
  const data = await service.create({
    payload: req.body,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'question.create',
    entity: 'QuestionBank',
    entityId: data.id,
    metadata: {
      questionCode: data.questionCode,
      type: data.type,
    },
  });

  return created(res, {
    message: 'Question created successfully.',
    data,
  });
});

/**
 * Get Question By Id
 */
const getQuestion = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Question',
    data,
  });
});

/**
 * List Questions
 */
const listQuestions = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      type: req.query.type,
      category: req.query.category,
      difficulty: req.query.difficulty,
      status: req.query.status,
      includeDeleted: req.query.includeDeleted,
    },
  });

  return success(res, {
    message: 'Questions',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

/**
 * Update Question
 */
const updateQuestion = asyncHandler(async (req, res) => {
  const data = await service.update({
    id: req.params.id,
    companyId: req.user.companyId,
    payload: req.body,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'question.update',
    entity: 'QuestionBank',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Question updated successfully.',
    data,
  });
});

/**
 * Soft Delete Question
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  await service.remove({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'question.delete',
    entity: 'QuestionBank',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Question deleted successfully.',
  });
});

/**
 * Activate Question
 */
const activateQuestion = asyncHandler(async (req, res) => {
  const data = await service.activate({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'question.activate',
    entity: 'QuestionBank',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Question activated successfully.',
    data,
  });
});

/**
 * Inactivate Question
 */
const inactivateQuestion = asyncHandler(async (req, res) => {
  const data = await service.inactivate({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'question.inactivate',
    entity: 'QuestionBank',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Question inactivated successfully.',
    data,
  });
});

module.exports = {
  createQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  activateQuestion,
  inactivateQuestion,
};