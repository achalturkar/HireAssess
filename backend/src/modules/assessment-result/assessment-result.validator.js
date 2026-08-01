'use strict';

const Joi = require('joi');

/**
 * Id param only (get)
 */
const idParamValidator = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * Attempt id param only (get by attempt)
 */
const attemptParamValidator = {
  params: Joi.object({
    attemptId: Joi.string().uuid().required(),
  }),
};

/**
 * List
 */
const listValidator = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(200),
    candidateId: Joi.string().uuid(),
    assessmentId: Joi.string().uuid(),
    minScore: Joi.number().min(0).max(100),
    maxScore: Joi.number().min(0).max(100),
    sortBy: Joi.string().valid('overallScore', 'createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

module.exports = {
  idParamValidator,
  attemptParamValidator,
  listValidator,
};
