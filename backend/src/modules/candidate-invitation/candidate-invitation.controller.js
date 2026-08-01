'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

const service = require('./candidate-invitation.services');

/**
 * Create Invitation
 */
const createInvitation = asyncHandler(async (req, res) => {
  const data = await service.create({
    payload: req.body,
    companyId: req.user.companyId,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'candidate_invitation.create',
    entity: 'CandidateInvitation',
    entityId: data.id,
    metadata: { candidateId: data.candidateId },
  });

  return created(res, {
    message: 'Invitation created successfully.',
    data,
  });
});

/**
 * Get Invitation By Id (admin)
 */
const getInvitation = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Invitation',
    data,
  });
});

/**
 * Get Invitation By Token (public — candidate-facing)
 */
const getInvitationByToken = asyncHandler(async (req, res) => {
  const data = await service.getByToken({ token: req.params.token });

  return success(res, {
    message: 'Invitation',
    data,
  });
});

/**
 * List Invitations
 */
const listInvitations = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      candidateId: req.query.candidateId,
      status: req.query.status,
    },
  });

  return success(res, {
    message: 'Invitations',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

/**
 * Start Invitation (public — by token)
 */
const startInvitation = asyncHandler(async (req, res) => {
  const data = await service.start({ token: req.params.token });

  return success(res, {
    message: 'Invitation marked as started.',
    data,
  });
});

/**
 * Complete Invitation (public — by token)
 */
const completeInvitation = asyncHandler(async (req, res) => {
  const data = await service.complete({ token: req.params.token });

  return success(res, {
    message: 'Invitation marked as completed.',
    data,
  });
});

/**
 * Expire Invitation (admin — by id)
 */
const expireInvitation = asyncHandler(async (req, res) => {
  const data = await service.expire({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'candidate_invitation.expire',
    entity: 'CandidateInvitation',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Invitation marked as expired.',
    data,
  });
});

/**
 * Resend Invitation (admin — by id)
 */
const resendInvitation = asyncHandler(async (req, res) => {
  const data = await service.resend({
    id: req.params.id,
    companyId: req.user.companyId,
    expiresInHours: req.body?.expiresInHours,
  });

  await writeAudit({
    req,
    action: 'candidate_invitation.resend',
    entity: 'CandidateInvitation',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Invitation resent successfully.',
    data,
  });
});

module.exports = {
  createInvitation,
  getInvitation,
  getInvitationByToken,
  listInvitations,
  startInvitation,
  completeInvitation,
  expireInvitation,
  resendInvitation,
};