'use strict';

const { body, param, query } = require('express-validator');

const createValidator = [
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('companyId').optional().isUUID(),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').optional().isUUID(),
];

const updateValidator = [
  param('id').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').optional().isUUID(),
];

const idParamValidator = [param('id').isUUID()];

const listValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('companyId').optional().isUUID(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

module.exports = { createValidator, updateValidator, idParamValidator, listValidator };
