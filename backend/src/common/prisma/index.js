'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('tsx/cjs');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const connectPrisma = async () => {
  await prisma.$connect();
};
// console.log(Object.keys(prisma));

const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

module.exports = { prisma, connectPrisma, disconnectPrisma };
