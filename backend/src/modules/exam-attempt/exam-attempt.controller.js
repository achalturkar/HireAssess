'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

const service = require('./exam-attempt.services');

const getQuestions = asyncHandler(async (req, res) => {
  const data = await service.getQuestions({
    token: req.params.token,
  });

  return success(res, {
    message: 'Questions',
    data,
  });
});

/**
 * Start (or resume) Attempt — public, by token
 */
const startAttempt = asyncHandler(async (req, res) => {
  const data = await service.startByToken({ token: req.params.token });

  return created(res, {
    message: 'Attempt started.',
    data,
  });
});

/**
 * Get current Attempt — public, by token (resume / rehydrate on refresh)
 */
const getAttemptByToken = asyncHandler(async (req, res) => {
  const data = await service.getByToken({ token: req.params.token });

  return success(res, {
    message: 'Attempt',
    data,
  });
});

/**
 * Submit Attempt — public, by token
 */
const submitAttempt = asyncHandler(async (req, res) => {
  const data = await service.submitByToken({ token: req.params.token });

  return success(res, {
    message: 'Attempt submitted successfully.',
    data,
  });
});

/**
 * Get Attempt — admin
 */
const getAttempt = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Attempt',
    data,
  });
});

/**
 * List Attempts — admin
 */
const listAttempts = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      candidateId: req.query.candidateId,
      assessmentId: req.query.assessmentId,
      status: req.query.status,
    },
  });

  return success(res, {
    message: 'Attempts',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

/**
 * Expire Attempt — admin
 */
const expireAttempt = asyncHandler(async (req, res) => {
  const data = await service.expire({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  await writeAudit({
    req,
    action: 'exam_attempt.expire',
    entity: 'ExamAttempt',
    entityId: req.params.id,
  });

  return success(res, {
    message: 'Attempt marked as expired.',
    data,
  });
});

/**
 * Admin View Selected Questions
 */
const getSelectedQuestions = asyncHandler(async (req, res) => {
  const data = await service.getSelectedQuestions({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Selected Questions',
    data,
  });
});

const resumeExam = asyncHandler(async (req,res)=>{

    const data =
        await service.resumeExam({

            token:req.params.token

        });

    return success(res,{

        message:"Resume Exam",

        data

    });

});

module.exports = {
  startAttempt,
  getAttemptByToken,
  submitAttempt,
  getAttempt,
  listAttempts,
  expireAttempt,
  getQuestions,
  getSelectedQuestions,
  resumeExam,
};