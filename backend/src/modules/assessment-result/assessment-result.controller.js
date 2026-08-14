'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const logger = require('../../common/logger');

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
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
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

const getCandidateResult = asyncHandler(async (req, res) => {
  const data = await service.getCandidateResult({
    attemptId: req.params.attemptId,
    companyId: req.user.companyId,
  });

  return success(res, {
    message: 'Candidate Result',
    data,
  });
});

/**
 * Builds a filesystem/header-safe candidate name for a download filename,
 * shared by both the report and certificate handlers below.
 */
const safeCandidateFilename = (bundle) => {
  const candidateName = bundle.candidate
    ? `${bundle.candidate.firstName ?? 'Candidate'} ${bundle.candidate.lastName ?? ''}`.trim()
    : 'Candidate';
  return candidateName.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_') || 'Candidate';
};

/**
 * Streams a PDFKit document to the response, wired so that any error —
 * either thrown synchronously while building the document, or emitted
 * asynchronously while streaming it — ends in a clean JSON error response
 * (if headers haven't gone out yet) or a terminated connection (if they
 * have), rather than a silently truncated/corrupt PDF download.
 */
const streamPdf = (res, { buildDoc, filename, context }) => {
  let doc;
  try {
    doc = buildDoc();
  } catch (err) {
    logger.error(`PDF generation failed (${context}): ${err.stack || err.message}`);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
    }
    return res.end();
  }

  doc.on('error', (err) => {
    logger.error(`PDF stream error (${context}): ${err.stack || err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream PDF.' });
    } else {
      res.end();
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);
  doc.end();
};

const getCandidateResultPdf = asyncHandler(async (req, res) => {
  const bundle = await service.getCandidateResult({
    attemptId: req.params.attemptId,
    companyId: req.user.companyId,
  });

  const { generateResultPdf } = require('./assessment-result.pdf');
  const filename = `${safeCandidateFilename(bundle)}_Assessment_report.pdf`;

  streamPdf(res, {
    buildDoc: () => generateResultPdf({ bundle }),
    filename,
    context: `report attempt=${req.params.attemptId}`,
  });
});

const getCandidateResultCertificatePdf = asyncHandler(async (req, res) => {
  const bundle = await service.getCandidateResult({
    attemptId: req.params.attemptId,
    companyId: req.user.companyId,
  });

  const { generateCertificatePdf } = require('./assessment-result.certificate.pdf');
  const filename = `${safeCandidateFilename(bundle)}_Certificate.pdf`;

  streamPdf(res, {
    buildDoc: () => generateCertificatePdf({ bundle }),
    filename,
    context: `certificate attempt=${req.params.attemptId}`,
  });
});

module.exports = {
  getResult,
  getResultByAttempt,
  getCandidateResult,
  getCandidateResultPdf,
  getCandidateResultCertificatePdf,

  listResults,
};