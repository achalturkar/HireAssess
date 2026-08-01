'use strict';

const Joi = require('joi');

const STATUSES = [
  'INVITED',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'WITHDRAWN',
];

/**
 * Create
 */
const createValidator = {
  body: Joi.object({
    assessmentId: Joi.string().uuid().required(),

    clientId: Joi.string().uuid().required(),

    firstName: Joi.string().max(100).required(),

    lastName: Joi.string().max(100).required(),

    email: Joi.string().email().required(),

    phone: Joi.string().max(30).allow(null, ''),
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
    firstName: Joi.string().max(100),

    lastName: Joi.string().max(100),

    email: Joi.string().email(),

    phone: Joi.string().max(30).allow(null, ''),

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
    assessmentId: Joi.string().uuid(),
    clientId: Joi.string().uuid(),
    status: Joi.string().valid(...STATUSES),
    sortBy: Joi.string().valid(
      'firstName',
      'lastName',
      'email',
      'status',
      'createdAt',
      'updatedAt'
    ),
    sortOrder: Joi.string().valid('asc', 'desc'),
    includeDeleted: Joi.string().valid('true', 'false'),
  }),
};

/**
 * Id param only (get / delete)
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