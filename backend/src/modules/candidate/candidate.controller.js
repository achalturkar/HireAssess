'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

const service = require('./candidate.services');

/**
 * Create Candidate
 */
const createCandidate = asyncHandler(async (req, res) => {
  const data = await service.create({
    payload: req.body,
    companyId: req.user.companyId,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'candidate.create',
    entity: 'Candidate',
    entityId: data.id,
    metadata: {
      email: data.email,
      assessmentId: data.assessmentId,
    },
  });

  return created(res, {
    message: 'Candidate created successfully.',
    data,
  });
});

/**
 * Get Candidate By Id
 */
const getCandidate = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Candidate',
    data,
  });
});

/**
 * List Candidates
 */
const listCandidates = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      assessmentId: req.query.assessmentId,
      clientId: req.query.clientId,
      status: req.query.status,
      includeDeleted: req.query.includeDeleted,
    },
  });

  return success(res, {
    message: 'Candidates',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

/**
 * Update Candidate
 */
const updateCandidate = asyncHandler(async (req, res) => {
  const data = await service.update({
    id: req.params.id,
    companyId: req.user.companyId,
    payload: req.body,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'candidate.update',
    entity: 'Candidate',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Candidate updated successfully.',
    data,
  });
});

/**
 * Soft Delete Candidate
 */
const deleteCandidate = asyncHandler(async (req, res) => {
  await service.remove({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'candidate.delete',
    entity: 'Candidate',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Candidate deleted successfully.',
  });
});

/**
 * Start Candidate Assessment
 */
const startCandidate = asyncHandler(async (req, res) => {
  const data = await service.start({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'candidate.start',
    entity: 'Candidate',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Candidate marked as in progress.',
    data,
  });
});

/**
 * Complete Candidate Assessment
 */
const completeCandidate = asyncHandler(async (req, res) => {
  const data = await service.complete({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'candidate.complete',
    entity: 'Candidate',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Candidate marked as completed.',
    data,
  });
});

/**
 * Expire Candidate Invitation
 */
const expireCandidate = asyncHandler(async (req, res) => {
  const data = await service.expire({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'candidate.expire',
    entity: 'Candidate',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Candidate marked as expired.',
    data,
  });
});

/**
 * Withdraw Candidate
 */
const withdrawCandidate = asyncHandler(async (req, res) => {
  const data = await service.withdraw({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'candidate.withdraw',
    entity: 'Candidate',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Candidate marked as withdrawn.',
    data,
  });
});

module.exports = {
  createCandidate,
  getCandidate,
  listCandidates,
  updateCandidate,
  deleteCandidate,
  startCandidate,
  completeCandidate,
  expireCandidate,
  withdrawCandidate,
};