'use strict';

const Joi = require('joi');

const STATUSES = ['SENT', 'STARTED', 'COMPLETED', 'EXPIRED'];

/**
 * Create
 */
const createValidator = {
  body: Joi.object({
    candidateId: Joi.string().uuid().required(),
    expiresInHours: Joi.number().integer().min(1).max(24 * 30), // up to 30 days
  }),
};

/**
 * Resend
 */
const resendValidator = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    expiresInHours: Joi.number().integer().min(1).max(24 * 30),
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
    status: Joi.string().valid(...STATUSES),
    sortBy: Joi.string().valid('status', 'expiresAt', 'createdAt', 'updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

/**
 * Id param only (get / expire)
 */
const idParamValidator = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * Token param only (public get / start / complete)
 */
const tokenParamValidator = {
  params: Joi.object({
    token: Joi.string().length(64).hex().required(),
  }),
};

module.exports = {
  createValidator,
  resendValidator,
  listValidator,
  idParamValidator,
  tokenParamValidator,
};