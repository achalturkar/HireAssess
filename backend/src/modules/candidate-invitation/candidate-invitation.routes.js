'use strict';

const express = require('express');

const controller = require('./candidate-invitation.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./candidate-invitation.validator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Candidate Invitations
 *     description: Invitation links sent to candidates to take an assessment
 */

/* ------------------------------------------------------------------ */
/*  PUBLIC ROUTES — the token itself is the credential.                */
/*  Must be mounted BEFORE router.use(authenticate) below.             */
/* ------------------------------------------------------------------ */

/**
 * @openapi
 * /candidate-invitations/token/{token}:
 *   get:
 *     tags: [Candidate Invitations]
 *     summary: Get invitation by token (public, candidate-facing)
 */
router.get(
  '/token/:token',
  validate(v.tokenParamValidator),
  controller.getInvitationByToken
);

/**
 * @openapi
 * /candidate-invitations/token/{token}/start:
 *   post:
 *     tags: [Candidate Invitations]
 *     summary: Mark invitation as started (public, candidate opens the link)
 */
router.post(
  '/token/:token/start',
  validate(v.tokenParamValidator),
  controller.startInvitation
);

/**
 * @openapi
 * /candidate-invitations/token/{token}/complete:
 *   post:
 *     tags: [Candidate Invitations]
 *     summary: Mark invitation as completed (public, on assessment submit)
 */
router.post(
  '/token/:token/complete',
  validate(v.tokenParamValidator),
  controller.completeInvitation
);

/* ------------------------------------------------------------------ */
/*  ADMIN ROUTES — require an authenticated company user.              */
/* ------------------------------------------------------------------ */

router.use(authenticate);

/**
 * @openapi
 * /candidate-invitations:
 *   get:
 *     tags: [Candidate Invitations]
 *     summary: List Invitations
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SENT, STARTED, COMPLETED, EXPIRED]
 *   post:
 *     tags: [Candidate Invitations]
 *     summary: Create Invitation
 */
router
  .route('/')
  .get(
    authorize('candidate_invitation.view'),
    validate(v.listValidator),
    controller.listInvitations
  )
  .post(
    authorize('candidate_invitation.create'),
    validate(v.createValidator),
    controller.createInvitation
  );

/**
 * @openapi
 * /candidate-invitations/{id}:
 *   get:
 *     tags: [Candidate Invitations]
 *     summary: Get Invitation
 */
router.get(
  '/:id',
  authorize('candidate_invitation.view'),
  validate(v.idParamValidator),
  controller.getInvitation
);

/**
 * @openapi
 * /candidate-invitations/{id}/resend:
 *   post:
 *     tags: [Candidate Invitations]
 *     summary: Resend Invitation (new token & expiry — SENT only)
 */
router.post(
  '/:id/resend',
  authorize('candidate_invitation.update'),
  validate(v.resendValidator),
  controller.resendInvitation
);

/**
 * @openapi
 * /candidate-invitations/{id}/expire:
 *   post:
 *     tags: [Candidate Invitations]
 *     summary: Expire Invitation
 */
router.post(
  '/:id/expire',
  authorize('candidate_invitation.update'),
  validate(v.idParamValidator),
  controller.expireInvitation
);

module.exports = router;