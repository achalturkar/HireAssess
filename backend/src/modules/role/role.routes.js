'use strict';

const express = require('express');
const controller = require('./role.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');
const v = require('./role.validator');

const router = express.Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Roles
 *     description: Role & permissions management (dynamic RBAC)
 */

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List roles (scoped to current user's company; Super Admin can pass companyId)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Roles list }
 *   post:
 *     tags: [Roles]
 *     summary: Create a role with selected permissions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               companyId: { type: string, format: uuid, description: "Super Admin only" }
 *               permissionIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       201: { description: Role created }
 */
router
  .route('/')
  .get(authorize('roles.view'), validate(v.listValidator), controller.listRoles)
  .post(authorize('roles.create'), validate(v.createValidator), controller.createRole);

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Role }
 *       404: { description: Not found }
 *   put:
 *     tags: [Roles]
 *     summary: Update role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               permissionIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200: { description: Role updated }
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Role deleted }
 */
router
  .route('/:id')
  .get(authorize('roles.view'), validate(v.idParamValidator), controller.getRole)
  .put(authorize('roles.update'), validate(v.updateValidator), controller.updateRole)
  .delete(authorize('roles.delete'), validate(v.idParamValidator), controller.deleteRole);

module.exports = router;
