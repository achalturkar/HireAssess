'use strict';

const Joi = require('joi');

const LEVELS = ['ENTRY', 'MID', 'TOP'];

const STATUSES = ['ACTIVE', 'INACTIVE', 'DRAFT'];

/**
 * Create
 */
const createValidator = {
  body: Joi.object({
    companyId: Joi.string().uuid().required(),

    clientId: Joi.string().uuid().required(),

    name: Joi.string().max(200).required(),

    level: Joi.string()
      .valid(...LEVELS)
      .required(),

    likertCount: Joi.number().integer().min(0).default(0),

    sjqCount: Joi.number().integer().min(0).default(0),

    forcedChoiceCount: Joi.number().integer().min(0).default(0),

    durationMinutes: Joi.number().integer().min(1).required(),
  }),
};

/**
 * Update
 */
const updateValidator = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  body: Joi.object({
    clientId: Joi.string().uuid(),

    name: Joi.string().max(200),

    level: Joi.string().valid(...LEVELS),

    likertCount: Joi.number().integer().min(0),

    sjqCount: Joi.number().integer().min(0),

    forcedChoiceCount: Joi.number().integer().min(0),

    durationMinutes: Joi.number().integer().min(1),

    status: Joi.string().valid(...STATUSES),
  }).min(1),
};

/**
 * List
 */
const listValidator = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(200),
    search: Joi.string().allow(''),
    clientId: Joi.string().uuid(),
    level: Joi.string().valid(...LEVELS),
    status: Joi.string().valid(...STATUSES),
    sortBy: Joi.string().valid(
      'name',
      'level',
      'durationMinutes',
      'status',
      'createdAt',
      'updatedAt'
    ),
    sortOrder: Joi.string().valid('asc', 'desc'),
    includeDeleted: Joi.string().valid('true', 'false'),
  }),
};

/**
 * Id param only (get / delete / activate / inactivate)
 */
const idParamValidator = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createValidator,
  updateValidator,
  listValidator,
  idParamValidator,
};