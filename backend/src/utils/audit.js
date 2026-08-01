'use strict';

const { prisma } = require('../common/prisma');
const logger = require('../common/logger/index');

/**
 * Write an audit log entry.
 * Non-throwing: audit logging should never break the request flow.
 */
const writeAudit = async ({ req, action, entity, entityId = null, metadata = null }) => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: req?.user?.companyId || null,
        userId: req?.user?.id || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        metadata: metadata || undefined,
        ipAddress: (req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '').toString().slice(0, 50),
        userAgent: (req?.headers?.['user-agent'] || '').toString().slice(0, 500),
      },
    });
  } catch (err) {
    logger.error(`Audit write failed: ${err.message}`);
  }
};

module.exports = { writeAudit };
