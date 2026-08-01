'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

const service = require('./assessment.services');

/**
 * Create Assessment
 */
const createAssessment = asyncHandler(async (req, res) => {
  const data = await service.create({
    payload: req.body,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'assessment.create',
    entity: 'Assessment',
    entityId: data.id,
    metadata: {
      name: data.name,
      level: data.level,
      clientId: data.clientId,
    },
  });

  return created(res, {
    message: 'Assessment created successfully.',
    data,
  });
});

/**
 * Get Assessment By Id
 */
const getAssessment = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Assessment',
    data,
  });
});

/**
 * List Assessments
 */
const listAssessments = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      clientId: req.query.clientId,
      level: req.query.level,
      status: req.query.status,
      includeDeleted: req.query.includeDeleted,
    },
  });

  return success(res, {
    message: 'Assessments',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

/**
 * Update Assessment
 */
const updateAssessment = asyncHandler(async (req, res) => {
  const data = await service.update({
    id: req.params.id,
    companyId: req.user.companyId,
    payload: req.body,
    currentUser: req.user,
  });

  await writeAudit({
    req,
    action: 'assessment.update',
    entity: 'Assessment',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Assessment updated successfully.',
    data,
  });
});

/**
 * Soft Delete Assessment
 */
const deleteAssessment = asyncHandler(async (req, res) => {
  await service.remove({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'assessment.delete',
    entity: 'Assessment',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Assessment deleted successfully.',
  });
});

/**
 * Activate Assessment
 */
const activateAssessment = asyncHandler(async (req, res) => {
  const data = await service.activate({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'assessment.activate',
    entity: 'Assessment',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Assessment activated successfully.',
    data,
  });
});

/**
 * Inactivate Assessment
 */
const inactivateAssessment = asyncHandler(async (req, res) => {
  const data = await service.inactivate({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'assessment.inactivate',
    entity: 'Assessment',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Assessment inactivated successfully.',
    data,
  });
});

module.exports = {
  createAssessment,
  getAssessment,
  listAssessments,
  updateAssessment,
  deleteAssessment,
  activateAssessment,
  inactivateAssessment,
};