'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./permission.service');

const list = asyncHandler(async (req, res) => {
  const grouped = String(req.query.grouped || '').toLowerCase() === 'true';
  const data = await service.list({ grouped });
  return success(res, { message: 'Permissions', data });
});

module.exports = { list };
