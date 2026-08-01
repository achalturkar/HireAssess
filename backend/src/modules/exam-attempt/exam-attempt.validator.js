'use strict';

const Joi = require('joi');

const STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED'];

/**
 * Token param only (public start / get / submit)
 */
const tokenParamValidator = {
  params: Joi.object({
    token: Joi.string().length(64).hex().required(),
  }),
};

/**
 * Id param only (admin get / expire)
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
    limit: Joi.number().integer().min(1).max(200),
    candidateId: Joi.string().uuid(),
    assessmentId: Joi.string().uuid(),
    status: Joi.string().valid(...STATUSES),
    sortBy: Joi.string().valid('startedAt', 'submittedAt', 'expiresAt', 'createdAt', 'updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

module.exports = {
  tokenParamValidator,
  idParamValidator,
  listValidator,
};