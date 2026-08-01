'use strict';

const express = require('express');

const controller = require('./assessment.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./assessment.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Assessments
 *     description: Assessment Management
 */

/**
 * @openapi
 * /assessments:
 *   get:
 *     tags: [Assessments]
 *     summary: List Assessments
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
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum:
 *             - ENTRY
 *             - MID
 *             - TOP
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
 *     tags: [Assessments]
 *     summary: Create Assessment
 */

router
  .route('/')
  .get(
    authorize('assessment.view'),
    validate(v.listValidator),
    controller.listAssessments
  )
  .post(
    authorize('assessment.create'),
    validate(v.createValidator),
    controller.createAssessment
  );

/**
 * @openapi
 * /assessments/{id}:
 *   get:
 *     tags: [Assessments]
 *     summary: Get Assessment
 *
 *   put:
 *     tags: [Assessments]
 *     summary: Update Assessment
 *
 *   delete:
 *     tags: [Assessments]
 *     summary: Delete Assessment
 */

router
  .route('/:id')
  .get(
    authorize('assessment.view'),
    validate(v.idParamValidator),
    controller.getAssessment
  )
  .put(
    authorize('assessment.update'),
    validate(v.updateValidator),
    controller.updateAssessment
  )
  .delete(
    authorize('assessment.delete'),
    validate(v.idParamValidator),
    controller.deleteAssessment
  );

/**
 * @openapi
 * /assessments/{id}/activate:
 *   post:
 *     tags: [Assessments]
 *     summary: Activate Assessment
 */

router.post(
  '/:id/activate',
  authorize('assessment.update'),
  validate(v.idParamValidator),
  controller.activateAssessment
);

/**
 * @openapi
 * /assessments/{id}/inactivate:
 *   post:
 *     tags: [Assessments]
 *     summary: Inactivate Assessment
 */

router.post(
  '/:id/inactivate',
  authorize('assessment.update'),
  validate(v.idParamValidator),
  controller.inactivateAssessment
);

module.exports = router;