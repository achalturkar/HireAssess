'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const service = require('./candidate-answer.services');

/**
 * Upsert Answer — public, by token
 */
const upsertAnswer = asyncHandler(async (req, res) => {
  const data = await service.upsertByToken({
    token: req.params.token,
    payload: req.body,
  });

  return success(res, {
    message: 'Answer saved.',
    data,
  });
});

/**
 * List Answers for current Attempt — public, by token
 */
const listAnswersByToken = asyncHandler(async (req, res) => {
  const data = await service.listByToken({ token: req.params.token });

  return success(res, {
    message: 'Answers',
    data,
  });
});

/**
 * Get Answer — admin
 */
const getAnswer = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Answer',
    data,
  });
});

/**
 * List Answers — admin
 */
const listAnswers = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      attemptId: req.query.attemptId,
      category: req.query.category,
      questionType: req.query.questionType,
    },
  });

  return success(res, {
    message: 'Answers',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

module.exports = {
  upsertAnswer,
  listAnswersByToken,
  getAnswer,
  listAnswers,
};