'use strict';

const express = require('express');

const controller = require('./exam-attempt.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./exam-attempt.validator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Exam Attempts
 *     description: A candidate's in-progress or completed run at an assessment
 */

/* ------------------------------------------------------------------ */
/*  PUBLIC ROUTES — the invitation token is the credential.            */
/*  Must be mounted BEFORE router.use(authenticate) below.             */
/* ------------------------------------------------------------------ */

/**
 * @openapi
 * /exam-attempts/token/{token}/start:
 *   post:
 *     tags: [Exam Attempts]
 *     summary: Start (or resume) an attempt. Idempotent — returns the
 *       same selectedQuestions on every call for the same candidate.
 */
router.post(
  '/token/:token/start',
  validate(v.tokenParamValidator),
  controller.startAttempt
);

/**
 * @openapi
 * /exam-attempts/token/{token}:
 *   get:
 *     tags: [Exam Attempts]
 *     summary: Get the current attempt (resume on page refresh)
 */
router.get(
  '/token/:token',
  validate(v.tokenParamValidator),
  controller.getAttemptByToken
);

/**
 * @openapi
 * /exam-attempts/token/{token}/submit:
 *   post:
 *     tags: [Exam Attempts]
 *     summary: Submit the attempt
 */
router.post(
  '/token/:token/submit',
  validate(v.tokenParamValidator),
  controller.submitAttempt
);

router.get(
  '/token/:token/questions',
  validate(v.tokenParamValidator),
  controller.getQuestions
);

/**
 * @openapi
 * /exam-attempts/token/{token}/resume:
 *   get:
 *     tags: [Exam Attempts]
 *     summary: Full resume bundle — candidate, assessment, attempt (with
 *       timer), selected questions, existing answers, and progress. Used
 *       by the candidate exam page on every load/refresh.
 *
 * MOVED HERE from below router.use(authenticate) — it was accidentally
 * requiring a bearer token despite being a public, token-authenticated
 * route like its siblings above, which broke every candidate page load
 * with "Missing or malformed Authorization header".
 */
router.get(
  '/token/:token/resume',
  validate(v.tokenParamValidator),
  controller.resumeExam
);

/* ------------------------------------------------------------------ */
/*  ADMIN ROUTES — require an authenticated company user.              */
/* ------------------------------------------------------------------ */

router.use(authenticate);

/**
 * @openapi
 * /exam-attempts:
 *   get:
 *     tags: [Exam Attempts]
 *     summary: List Attempts
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_PROGRESS, SUBMITTED, EXPIRED]
 */
router.get(
  '/',
  authorize('attempt.view'),
  validate(v.listValidator),
  controller.listAttempts
);

/**
 * @openapi
 * /exam-attempts/{id}:
 *   get:
 *     tags: [Exam Attempts]
 *     summary: Get Attempt
 */
router.get(
  '/:id',
  authorize('exam_attempt.view'),
  validate(v.idParamValidator),
  controller.getAttempt
);

/**
 * @openapi
 * /exam-attempts/{id}/expire:
 *   post:
 *     tags: [Exam Attempts]
 *     summary: Expire Attempt
 */
router.post(
  '/:id/expire',
  authorize('exam_attempt.update'),
  validate(v.idParamValidator),
  controller.expireAttempt
);

router.get(
  '/:id/questions',
  authorize('exam_attempt.view'),
  validate(v.idParamValidator),
  controller.getSelectedQuestions
);

module.exports = router;