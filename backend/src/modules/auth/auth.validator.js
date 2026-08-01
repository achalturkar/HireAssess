'use strict';

const { body } = require('express-validator');

const strongPassword = (field) =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 }).withMessage(`${field} must be 8-128 chars`)
    .matches(/[a-z]/).withMessage(`${field} must contain lowercase letter`)
    .matches(/[A-Z]/).withMessage(`${field} must contain uppercase letter`)
    .matches(/\d/).withMessage(`${field} must contain a digit`)
    .matches(/[!@#$%^&*(),.?":{}|<>_\-\[\]\\/]/).withMessage(`${field} must contain a special char`);

const loginValidator = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isString().isLength({ min: 1 }).withMessage('Password is required'),
];

const refreshValidator = [
  body('refreshToken').isString().isLength({ min: 20 }).withMessage('Refresh token is required'),
];

const logoutValidator = [
  body('refreshToken').optional().isString(),
];

const changePasswordValidator = [
  body('currentPassword').isString().isLength({ min: 1 }).withMessage('Current password is required'),
  strongPassword('newPassword'),
];

module.exports = {
  loginValidator,
  refreshValidator,
  logoutValidator,
  changePasswordValidator,
  strongPassword,
};
