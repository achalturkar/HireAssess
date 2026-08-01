'use strict';

const express = require('express');

const controller = require('./question.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./question.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Questions
 *     description: Question Bank Management
 */

/**
 * @openapi
 * /questions:
 *   get:
 *     tags: [Questions]
 *     summary: List Questions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum:
 *             - LIKERT
 *             - FORCED_CHOICE
 *             - SITUATIONAL_JUDGEMENT
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum:
 *             - EASY
 *             - MEDIUM
 *             - HARD
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *             - DRAFT
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *
 *   post:
 *     tags: [Questions]
 *     summary: Create Question
 */

router
  .route('/')
  .get(
    authorize('question.view'),
    validate(v.listValidator),
    controller.listQuestions
  )
  .post(
    authorize('question.create'),
    validate(v.createValidator),
    controller.createQuestion
  );

/**
 * @openapi
 * /questions/{id}:
 *   get:
 *     tags: [Questions]
 *     summary: Get Question
 *
 *   put:
 *     tags: [Questions]
 *     summary: Update Question
 *
 *   delete:
 *     tags: [Questions]
 *     summary: Delete Question
 */

router
  .route('/:id')
  .get(
    authorize('question.view'),
    validate(v.idParamValidator),
    controller.getQuestion
  )
  .put(
    authorize('question.update'),
    validate(v.updateValidator),
    controller.updateQuestion
  )
  .delete(
    authorize('question.delete'),
    validate(v.idParamValidator),
    controller.deleteQuestion
  );

/**
 * @openapi
 * /questions/{id}/activate:
 *   post:
 *     tags: [Questions]
 *     summary: Activate Question
 */

router.post(
  '/:id/activate',
  authorize('question.update'),
  validate(v.idParamValidator),
  controller.activateQuestion
);

/**
 * @openapi
 * /questions/{id}/inactivate:
 *   post:
 *     tags: [Questions]
 *     summary: Inactivate Question
 */

router.post(
  '/:id/inactivate',
  authorize('question.update'),
  validate(v.idParamValidator),
  controller.inactivateQuestion
);

module.exports = router;