'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

class BadRequestError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, errors);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message, errors = null) {
    super(message, 401, errors);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message, errors = null) {
    super(message, 403, errors);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends AppError {
  constructor(message, errors = null) {
    super(message, 404, errors);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message, errors = null) {
    super(message, 409, errors);
    this.name = 'ConflictError';
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message, errors = null) {
    super(message, 422, errors);
    this.name = 'UnprocessableEntityError';
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
};
