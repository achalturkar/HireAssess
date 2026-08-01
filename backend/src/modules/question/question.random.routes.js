'use strict';

const express = require('express');

const router = express.Router();

const controller = require('./question.random.controller');

const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get(
  '/random',
  controller.randomQuestions
);

module.exports = router;