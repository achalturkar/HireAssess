'use strict';

const Joi = require('joi');

const QUESTION_TYPES = [
  'LIKERT',
  'FORCED_CHOICE',
  'SITUATIONAL_JUDGEMENT',
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const STATUSES = ['ACTIVE', 'INACTIVE', 'DRAFT'];

/**
 * Option shape used by FORCED_CHOICE / SITUATIONAL_JUDGEMENT
 */
const optionSchema = Joi.object({
  id: Joi.string().max(20).required(),
  text: Joi.string().required(),
  score: Joi.number().required(),
});

/**
 * Scoring shape used by LIKERT
 */
const scoringSchema = Joi.object({
  reverse: Joi.boolean().default(false),
}).unknown(true);

/**
 * Create
 */
const createValidator = {
  body: Joi.object({
    companyId: Joi.string().uuid().required(),

    questionCode: Joi.string().max(100).required(),

    type: Joi.string()
      .valid(...QUESTION_TYPES)
      .required(),

    category: Joi.string().max(100).allow(null, ''),

    questionText: Joi.string().required(),

    options: Joi.when('type', {
      is: Joi.valid('FORCED_CHOICE', 'SITUATIONAL_JUDGEMENT'),
      then: Joi.array()
        .items(optionSchema)
        .min(2)
        .required(),
      otherwise: Joi.array().items(optionSchema).optional(),
    }),

    scoring: Joi.when('type', {
      is: 'LIKERT',
      then: scoringSchema.optional(),
      otherwise: scoringSchema.optional(),
    }),

    difficulty: Joi.string()
      .valid(...DIFFICULTIES)
      .optional(),
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
    questionCode: Joi.string().max(100),

    type: Joi.string().valid(...QUESTION_TYPES),

    category: Joi.string().max(100).allow(null, ''),

    questionText: Joi.string(),

    options: Joi.array().items(optionSchema).min(2),

    scoring: scoringSchema,

    difficulty: Joi.string().valid(...DIFFICULTIES),

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
    type: Joi.string().valid(...QUESTION_TYPES),
    category: Joi.string(),
    difficulty: Joi.string().valid(...DIFFICULTIES),
    status: Joi.string().valid(...STATUSES),
    sortBy: Joi.string().valid(
      'questionCode',
      'type',
      'category',
      'difficulty',
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