'use strict';

const express = require('express');
const controller = require('./company.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');
const v = require('./company.validator');

const router = express.Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Companies
 *     description: Company (tenant) management — Super Admin only
 */

/**
 * @openapi
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: List companies (with search, pagination, filtering)
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
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, SUSPENDED, INACTIVE] }
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200: { description: Companies list }
 *   post:
 *     tags: [Companies]
 *     summary: Create a company (also creates Company Admin role + user, sends welcome email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, adminFirstName, adminLastName, adminEmail]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               contactEmail: { type: string, format: email }
 *               contactPhone: { type: string }
 *               logoUrl: { type: string, format: uri }
 *               primaryColor: { type: string }
 *               address: { type: string }
 *               settings: { type: object }
 *               adminFirstName: { type: string }
 *               adminLastName: { type: string }
 *               adminEmail: { type: string, format: email }
 *               adminPassword: { type: string, description: "Optional. If omitted, a strong password is generated." }
 *     responses:
 *       201: { description: Company created }
 */
router
  .route('/')
  .get(authorize('company.view'), validate(v.listValidator), controller.listCompanies)
  .post(authorize('company.create'), validate(v.createValidator), controller.createCompany);

/**
 * @openapi
 * /companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *   put:
 *     tags: [Companies]
 *     summary: Update a company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *   delete:
 *     tags: [Companies]
 *     summary: Soft delete a company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router
  .route('/:id')
  .get(authorize('company.view'), validate(v.idParamValidator), controller.getCompany)
  .put(authorize('company.update'), validate(v.updateValidator), controller.updateCompany)
  .delete(authorize('company.delete'), validate(v.idParamValidator), controller.deleteCompany);

/**
 * @openapi
 * /companies/{id}/suspend:
 *   post:
 *     tags: [Companies]
 *     summary: Suspend a company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.post(
  '/:id/suspend',
  authorize('company.suspend'),
  validate(v.idParamValidator),
  controller.suspendCompany
);

/**
 * @openapi
 * /companies/{id}/activate:
 *   post:
 *     tags: [Companies]
 *     summary: Activate a company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.post(
  '/:id/activate',
  authorize('company.suspend'),
  validate(v.idParamValidator),
  controller.activateCompany
);

module.exports = router;
