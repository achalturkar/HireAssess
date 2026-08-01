'use strict';

const { body, param, query } = require('express-validator');

/**
 * Create Client Validation
 */
const createValidator = [
  body('companyId')
    .isUUID()
    .withMessage('Valid companyId is required'),

  body('clientCode')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 50 }),

  body('name')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 255 }),

  body('logoUrl')
    .optional()
    .isURL(),

  body('website')
    .optional()
    .isURL(),

  body('industry')
    .optional()
    .isLength({ max: 150 }),

  body('contactName')
    .optional()
    .isLength({ max: 150 }),

  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail(),

  body('contactPhone')
    .optional()
    .isLength({ max: 50 }),

  body('gstNumber')
    .optional()
    .isLength({ max: 30 }),

  body('panNumber')
    .optional()
    .isLength({ max: 20 }),

  body('addressLine1')
    .optional()
    .isLength({ max: 500 }),

  body('addressLine2')
    .optional()
    .isLength({ max: 500 }),

  body('city')
    .optional()
    .isLength({ max: 100 }),

  body('state')
    .optional()
    .isLength({ max: 100 }),

  body('country')
    .optional()
    .isLength({ max: 100 }),

  body('postalCode')
    .optional()
    .isLength({ max: 20 }),
];

/**
 * Update Client Validation
 */
const updateValidator = [
  param('id').isUUID(),

  body('clientCode')
    .optional()
    .isLength({ min: 2, max: 50 }),

  body('name')
    .optional()
    .isLength({ min: 2, max: 255 }),

  body('logoUrl')
    .optional()
    .isURL(),

  body('website')
    .optional()
    .isURL(),

  body('industry')
    .optional()
    .isLength({ max: 150 }),

  body('contactName')
    .optional()
    .isLength({ max: 150 }),

  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail(),

  body('contactPhone')
    .optional()
    .isLength({ max: 50 }),

  body('gstNumber')
    .optional()
    .isLength({ max: 30 }),

  body('panNumber')
    .optional()
    .isLength({ max: 20 }),

  body('addressLine1')
    .optional()
    .isLength({ max: 500 }),

  body('addressLine2')
    .optional()
    .isLength({ max: 500 }),

  body('city')
    .optional()
    .isLength({ max: 100 }),

  body('state')
    .optional()
    .isLength({ max: 100 }),

  body('country')
    .optional()
    .isLength({ max: 100 }),

  body('postalCode')
    .optional()
    .isLength({ max: 20 }),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']),
];

/**
 * ID Validation
 */
const idParamValidator = [
  param('id').isUUID(),
];

/**
 * List Validation
 */
const listValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }),

  // Raised from 100 -> 500. The Assessments page and its create/edit modal
  // both request `limit: 200` to populate the client dropdown in one shot,
  // so a max of 100 rejected that request with a 400 before it ever reached
  // the controller - which is why the dropdown showed up empty.
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }),

  query('search')
    .optional()
    .isString(),

  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']),

  query('includeDeleted')
    .optional()
    .isBoolean(),

  query('sortBy')
    .optional()
    .isIn([
      'name',
      'clientCode',
      'createdAt',
      'updatedAt',
      'status',
    ]),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']),
];

module.exports = {
  createValidator,
  updateValidator,
  idParamValidator,
  listValidator,
};