'use strict';

const express = require('express');

const controller = require('./candidate.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize, requireRole } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./candidate.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Candidates
 *     description: Candidate Management
 */

/**
 * @openapi
 * /candidates:
 *   get:
 *     tags: [Candidates]
 *     summary: List Candidates
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
 *         name: assessmentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - INVITED
 *             - IN_PROGRESS
 *             - COMPLETED
 *             - EXPIRED
 *             - WITHDRAWN
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *
 *   post:
 *     tags: [Candidates]
 *     summary: Create Candidate
 */

router
  .route('/')
  .get(
    authorize('candidate.view'),
    validate(v.listValidator),
    controller.listCandidates
  )
  .post(
    authorize('candidate.create'),
    validate(v.createValidator),
    controller.createCandidate
  );

/**
 * @openapi
 * /candidates/{id}:
 *   get:
 *     tags: [Candidates]
 *     summary: Get Candidate
 *
 *   put:
 *     tags: [Candidates]
 *     summary: Update Candidate
 *
 *   delete:
 *     tags: [Candidates]
 *     summary: Delete Candidate
 */

router
  .route('/:id')
  .get(
    authorize('candidate.view'),
    validate(v.idParamValidator),
    controller.getCandidate
  )
  .put(
    authorize('candidate.update'),
    validate(v.updateValidator),
    controller.updateCandidate
  )
  .delete(
    requireRole({ superAdmin: true }),
    validate(v.idParamValidator),
    controller.deleteCandidate
  );

/**
 * @openapi
 * /candidates/{id}/start:
 *   post:
 *     tags: [Candidates]
 *     summary: Start Candidate Assessment (INVITED -> IN_PROGRESS)
 */

router.post(
  '/:id/start',
  authorize('candidate.update'),
  validate(v.idParamValidator),
  controller.startCandidate
);

/**
 * @openapi
 * /candidates/{id}/complete:
 *   post:
 *     tags: [Candidates]
 *     summary: Complete Candidate Assessment (-> COMPLETED)
 */

router.post(
  '/:id/complete',
  authorize('candidate.update'),
  validate(v.idParamValidator),
  controller.completeCandidate
);

/**
 * @openapi
 * /candidates/{id}/expire:
 *   post:
 *     tags: [Candidates]
 *     summary: Expire Candidate Invitation (-> EXPIRED)
 */

router.post(
  '/:id/expire',
  authorize('candidate.update'),
  validate(v.idParamValidator),
  controller.expireCandidate
);

/**
 * @openapi
 * /candidates/{id}/withdraw:
 *   post:
 *     tags: [Candidates]
 *     summary: Withdraw Candidate (-> WITHDRAWN)
 */

router.post(
  '/:id/withdraw',
  authorize('candidate.update'),
  validate(v.idParamValidator),
  controller.withdrawCandidate
);

module.exports = router;