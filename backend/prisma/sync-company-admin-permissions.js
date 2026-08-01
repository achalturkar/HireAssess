'use strict';

require('tsx/cjs');

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function sync() {
  const globalRole = await prisma.role.findFirst({
    where: {
      companyId: null,
      isCompanyAdmin: true,
    },
    include: {
      rolePermissions: true,
    },
  });

  if (!globalRole) {
    throw new Error('Global Company Admin role not found');
  }

  const companyRoles = await prisma.role.findMany({
    where: {
      isCompanyAdmin: true,
      NOT: {
        companyId: null,
      },
    },
  });

  for (const role of companyRoles) {
    await prisma.rolePermission.createMany({
      data: globalRole.rolePermissions.map((rp) => ({
        roleId: role.id,
        permissionId: rp.permissionId,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`✓ Synced ${companyRoles.length} company roles`);
}

sync()
  .finally(() => prisma.$disconnect());