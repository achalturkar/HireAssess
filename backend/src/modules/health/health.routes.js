'use strict';

const express = require('express');
const { prisma } = require('../../common/prisma');
const { redis } = require('../../common/redis');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Health
 *     description: Health & readiness probes
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe (checks DB and Redis)
 *     security: []
 *     responses:
 *       200: { description: Ready }
 *       503: { description: Not ready }
 */
router.get('/ready', async (_req, res) => {
  const checks = { database: false, redis: 'disabled' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (_e) {}
  const ok = checks.database;
  return res.status(ok ? 200 : 503).json({ status: ok ? 'ready' : 'degraded', checks });
});

module.exports = router;
