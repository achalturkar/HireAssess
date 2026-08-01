'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');
const service = require('./role.service');

const createRole = asyncHandler(async (req, res) => {
  const role = await service.create({ currentUser: req.user, payload: req.body });
  await writeAudit({ req, action: 'roles.create', entity: 'Role', entityId: role.id, metadata: { name: role.name } });
  return created(res, { message: 'Role created', data: role });
});

const getRole = asyncHandler(async (req, res) => {
  const role = await service.getById({ currentUser: req.user, id: req.params.id });
  return success(res, { message: 'Role', data: role });
});

const listRoles = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, total } = await service.list({
    currentUser: req.user,
    query: { ...pagination, companyId: req.query.companyId },
  });
  return success(res, {
    message: 'Roles',
    data: items,
    meta: buildMeta({ page: pagination.page, limit: pagination.limit, total }),
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await service.update({ currentUser: req.user, id: req.params.id, payload: req.body });
  await writeAudit({ req, action: 'roles.update', entity: 'Role', entityId: role.id });
  return success(res, { message: 'Role updated', data: role });
});

const deleteRole = asyncHandler(async (req, res) => {
  await service.remove({ currentUser: req.user, id: req.params.id });
  await writeAudit({ req, action: 'roles.delete', entity: 'Role', entityId: req.params.id });
  return success(res, { message: 'Role deleted' });
});

module.exports = { createRole, getRole, listRoles, updateRole, deleteRole };
