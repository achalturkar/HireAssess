'use strict';

const asyncHandler = require('../../utils/asyncHandler');

const service = require('./question.random.service');

const { success } = require('../../utils/response');

const randomQuestions = asyncHandler(async (req, res) => {

  const data = service.generateQuestionSet({

    level: req.query.level,

    likertCount: Number(req.query.likert || 0),

    sjqCount: Number(req.query.sjq || 0),

    forcedChoiceCount: Number(req.query.forcedChoice || 0),

    analyticalCount: Number(req.query.analytical || 0),

    logicalReasoningCount: Number(req.query.logicalReasoning || 0),

  });

  return success(res, {

    message: 'Random Questions',

    data,

  });

});

module.exports = {
  randomQuestions,
};