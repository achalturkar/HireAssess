'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { writeAudit } = require('../../utils/audit');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password, req });
  await writeAudit({ req: { ...req, user: { id: result.user.id, companyId: result.user.companyId } }, action: 'auth.login', entity: 'User', entityId: result.user.id });
  return success(res, {
    message: 'Login successful',
    data: result,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh({ refreshToken, req });
  return success(res, { message: 'Token refreshed', data: result });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  await authService.logout({ refreshToken, userId: req.user?.id });
  if (req.user) {
    await writeAudit({ req, action: 'auth.logout', entity: 'User', entityId: req.user.id });
  }
  return success(res, { message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  return success(res, { message: 'Current user', data });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword({
    userId: req.user.id,
    currentPassword,
    newPassword,
  });
  await writeAudit({ req, action: 'auth.change_password', entity: 'User', entityId: req.user.id });
  return created(res, { message: 'Password changed successfully. Please log in again.' });
});

module.exports = { login, refresh, logout, me, changePassword };
