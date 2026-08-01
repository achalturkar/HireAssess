'use strict';

const { validationResult } = require('express-validator');
const { UnprocessableEntityError } = require('../utils/errors');

/**
 * Runs express-validator chains and returns 422 with details if any errors.
 */
const validate = (validations) => async (req, res, next) => {
  try {
    if (Array.isArray(validations)) {
      await Promise.all(validations.map((v) => v.run(req)));
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const details = errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
        value: e.value,
      }));
      throw new UnprocessableEntityError('Validation failed', details);
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validate };
