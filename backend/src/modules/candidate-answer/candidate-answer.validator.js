'use strict';

const Joi = require('joi');

// Mirrors the categories used as keys in ExamAttempt.selectedQuestions.
// Extend this list if you add more question categories later.
const CATEGORIES = ['likert', 'sjq', 'forced'];

/**
 * Token param only (public list)
 */
const tokenParamValidator = {
  params: Joi.object({
    token: Joi.string().length(64).hex().required(),
  }),
};

/**
 * Upsert Answer (public, by token)
 */
const upsertValidator = {
  params: Joi.object({
    token: Joi.string().length(64).hex().required(),
  }),
  body: Joi.object({
    // Not a UUID — question ids look like "lk12", "sj29", "fc08".
    questionId: Joi.string().max(50).required(),
    questionType: Joi.string().max(50).required(),
    category: Joi.string().valid(...CATEGORIES).required(),
    // Flexible payload: { "answer": 5 } or { "selected": "q3" }, etc.
    answer: Joi.object().min(1).required(),
  }),
};

/**
 * Id param only (admin get)
 */
const idParamValidator = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * List (admin)
 */
const listValidator = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(500),
    attemptId: Joi.string().uuid(),
    category: Joi.string().valid(...CATEGORIES),
    questionType: Joi.string().max(50),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'score'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

module.exports = {
  tokenParamValidator,
  upsertValidator,
  idParamValidator,
  listValidator,
};