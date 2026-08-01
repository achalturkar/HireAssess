'use strict';

const path = require('path');
const fs = require('fs');

const generatedDir = path.resolve(__dirname, '../../generated/prisma');
const clientEntry = path.join(generatedDir, 'client.ts');

if (!fs.existsSync(clientEntry)) {
  throw new Error(`Prisma client entry not found: ${clientEntry}`);
}

const { PrismaClient } = require(clientEntry);
module.exports = { PrismaClient };
