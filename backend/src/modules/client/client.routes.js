'use strict';

const express = require('express');

const controller = require('./client.controller');

const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorize.middleware');
const { validate } = require('../../middleware/validate.middleware');

const v = require('./client.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Clients
 *     description: Client Management
 */

/**
 * @openapi
 * /clients:
 *   get:
 *     tags: [Clients]
 *     summary: List Clients
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *
 *   post:
 *     tags: [Clients]
 *     summary: Create Client
 */

router
    .route('/')
    .get(
        authorize('client.view'),
        validate(v.listValidator),
        controller.listClients
    )
    .post(
        authorize('client.create'),
        validate(v.createValidator),
        controller.createClient
    );

/**
 * @openapi
 * /clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get Client
 *
 *   put:
 *     tags: [Clients]
 *     summary: Update Client
 *
 *   delete:
 *     tags: [Clients]
 *     summary: Delete Client
 */

router
    .route('/:id')
    .get(
        authorize('client.view'),
        validate(v.idParamValidator),
        controller.getClient
    )
    .put(
        authorize('client.update'),
        validate(v.updateValidator),
        controller.updateClient
    )
    .delete(
        authorize('client.delete'),
        validate(v.idParamValidator),
        controller.deleteClient
    );

/**
 * @openapi
 * /clients/{id}/activate:
 *   post:
 *     tags: [Clients]
 *     summary: Activate Client
 */

router.post(
    '/:id/activate',
    authorize('client.update'),
    validate(v.idParamValidator),
    controller.activateClient
);

/**
 * @openapi
 * /clients/{id}/inactivate:
 *   post:
 *     tags: [Clients]
 *     summary: Inactivate Client
 */

router.post(
    '/:id/inactivate',
    authorize('client.update'),
    validate(v.idParamValidator),
    controller.inactivateClient
);

module.exports = router;