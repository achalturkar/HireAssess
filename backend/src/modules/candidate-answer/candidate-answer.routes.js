'use strict';

const express = require('express');

const controller = require('./candidate-answer.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./candidate-answer.validator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Candidate Answers
 *     description: Answers a candidate submits during an exam attempt
 */

/* ------------------------------------------------------------------ */
/*  PUBLIC ROUTES — the invitation token is the credential.            */
/*  Must be mounted BEFORE router.use(authenticate) below.             */
/* ------------------------------------------------------------------ */

/**
 * @openapi
 * /candidate-answers/token/{token}:
 *   put:
 *     tags: [Candidate Answers]
 *     summary: Save (create or update) a single answer for the current attempt
 *   get:
 *     tags: [Candidate Answers]
 *     summary: List all answers already saved for the current attempt (resume on refresh)
 */
router
  .route('/token/:token')
  .put(validate(v.upsertValidator), controller.upsertAnswer)
  .get(validate(v.tokenParamValidator), controller.listAnswersByToken);

/* ------------------------------------------------------------------ */
/*  ADMIN ROUTES — require an authenticated company user.              */
/* ------------------------------------------------------------------ */

router.use(authenticate);

/**
 * @openapi
 * /candidate-answers:
 *   get:
 *     tags: [Candidate Answers]
 *     summary: List Answers
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: attemptId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [likert, sjq, forced] }
 *       - in: query
 *         name: questionType
 *         schema: { type: string }
 */
router.get(
  '/',
  authorize('candidate_answer.view'),
  validate(v.listValidator),
  controller.listAnswers
);

/**
 * @openapi
 * /candidate-answers/{id}:
 *   get:
 *     tags: [Candidate Answers]
 *     summary: Get Answer
 */
router.get(
  '/:id',
  authorize('candidate_answer.view'),
  validate(v.idParamValidator),
  controller.getAnswer
);

module.exports = router;