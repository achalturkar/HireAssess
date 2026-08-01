'use strict';

const { prisma } = require('../../common/prisma');

const listPermissions = () => prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });

const findByKeys = (keys) =>
  prisma.permission.findMany({ where: { key: { in: keys } } });

const findAllKeys = async () => {
  const perms = await prisma.permission.findMany({ select: { key: true } });
  return perms.map((p) => p.key);
};

module.exports = { listPermissions, findByKeys, findAllKeys };