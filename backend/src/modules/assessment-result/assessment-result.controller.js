'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const service = require('./assessment-result.services');

/**
 * Get Result
 */
const getResult = asyncHandler(async (req, res) => {
  const data = await service.getById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Result',
    data,
  });
});

/**
 * Get Result By Attempt
 */
const getResultByAttempt = asyncHandler(async (req, res) => {
  const data = await service.getByAttemptId({
    attemptId: req.params.attemptId,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Result',
    data,
  });
});

/**
 * List Results
 */
const listResults = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);

  const { items, total } = await service.list({
    companyId: req.user.companyId,
    query: {
      ...pagination,
      candidateId: req.query.candidateId,
      assessmentId: req.query.assessmentId,
      minScore: req.query.minScore !== undefined ? Number(req.query.minScore) : undefined,
      maxScore: req.query.maxScore !== undefined ? Number(req.query.maxScore) : undefined,
    },
  });

  return success(res, {
    message: 'Results',
    data: items,
    meta: buildMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
});

const getCandidateResult =
asyncHandler(async (req,res)=>{

    const data =
    await service.getCandidateResult({

        attemptId:req.params.attemptId,

        companyId:req.user.companyId

    });

    return success(res,{
        message:"Candidate Result",
        data
    });

});

const getCandidateResultPdf = asyncHandler(async (req, res) => {
  const bundle = await service.getCandidateResult({
    attemptId: req.params.attemptId,
    companyId: req.user.companyId,
  });

  const { generateResultPdf } = require('./assessment-result.pdf');
  const doc = generateResultPdf({ bundle });

  const candidateName = bundle.candidate ? `${bundle.candidate.firstName ?? 'Candidate'} ${bundle.candidate.lastName ?? ''}`.trim() : 'Candidate';
  const safeName = candidateName.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
  const filename = `${safeName}_Assessment report.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);
  doc.end();
});

module.exports = {
  getResult,
  getResultByAttempt,
  getCandidateResult,
  getCandidateResultPdf,

  listResults,
};

