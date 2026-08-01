'use strict';

const logger = require('../common/logger');

/**
 * HTTP access logger — minimal, request-scoped.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '-';
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ip=${ip} user=${req.user?.id || 'anon'}`
    );
  });
  next();
};

module.exports = { requestLogger };
