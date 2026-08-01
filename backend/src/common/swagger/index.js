'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Managerial Assessment Portal API',
      version: '1.0.0',
      description:
        'Multi-tenant SaaS backend for the Managerial Assessment Portal. Implements STEP 1 (Auth + core infra) and STEP 2 (Company Management + Dynamic RBAC).',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../../modules/**/*.routes.js'),
    path.join(__dirname, '../../modules/**/*.docs.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

const mountSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
};

module.exports = { mountSwagger, swaggerSpec };
