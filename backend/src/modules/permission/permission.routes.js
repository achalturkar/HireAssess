'use strict';

const express = require('express');
const controller = require('./permission.control');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Permissions
 *     description: List of all available system permissions (used by RBAC UI to build custom roles)
 */

/**
 * @openapi
 * /permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: List all available permissions
 *     parameters:
 *       - in: query
 *         name: grouped
 *         schema: { type: boolean }
 *         description: Group permissions by module
 *     responses:
 *       200: { description: Permissions returned }
 */
router.get('/', authenticate, authorize('permissions.view'), controller.list);

module.exports = router;
