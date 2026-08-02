'use strict';

const express = require('express');

const controller = require('./assessment-result.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./assessment-result.validator');

const router = express.Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Assessment Results
 *     description: Scored outcome of a completed exam attempt
 */

/**
 * @openapi
 * /assessment-results:
 *   get:
 *     tags: [Assessment Results]
 *     summary: List Results
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: candidateId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: assessmentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: minScore
 *         schema: { type: number }
 *       - in: query
 *         name: maxScore
 *         schema: { type: number }
 */
router.get(
  '/',
  authorize('assessment_result.view'),
  validate(v.listValidator),
  controller.listResults
);

/**
 * @openapi
 * /assessment-results/attempt/{attemptId}:
 *   get:
 *     tags: [Assessment Results]
 *     summary: Get Result By Attempt
 */
router.get(
  '/attempt/:attemptId',
  authorize('assessment_result.view'),
  validate(v.attemptParamValidator),
  controller.getResultByAttempt
);

/**
 * @openapi
 * /assessment-results/{id}:
 *   get:
 *     tags: [Assessment Results]
 *     summary: Get Result
 */
router.get(
  '/:id',
  authorize('assessment_result.view'),
  validate(v.idParamValidator),
  controller.getResult
);


router.get(
    "/candidate/:attemptId",
    authorize("assessment_result.view"),
    controller.getCandidateResult
);

router.get(
    "/candidate/:attemptId/pdf",
    authorize("assessment_result.view"),
    controller.getCandidateResultPdf
);

module.exports = router;
