'use strict';

const crypto = require('crypto');

// Adjust these paths to wherever your candidate module actually lives
const candidateRepo = require('../candidate/candidate.repository');
const candidateService = require('../candidate/candidate.services');
const companyRepo = require('../company/company.repository'); // NEW — for the company name in the email
const config = require('../../config'); // NEW — for frontendUrl
const logger = require('../../common/logger');
const { sendMail, buildCandidateInvitationEmail } = require('../../utils/mailer'); // NEW
const repo = require('./candidate-invitation.repository');

const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../../utils/errors');

const DEFAULT_EXPIRY_HOURS = 72;
const TERMINAL_STATUSES = ['COMPLETED', 'EXPIRED'];

const toDto = (invitation) => ({
  id: invitation.id,
  candidateId: invitation.candidateId,
  token: invitation.token,
  status: invitation.status,
  expiresAt: invitation.expiresAt,
  createdAt: invitation.createdAt,
  updatedAt: invitation.updatedAt,
  candidate: invitation.candidate
    ? {
        id: invitation.candidate.id,
        firstName: invitation.candidate.firstName,
        lastName: invitation.candidate.lastName,
        email: invitation.candidate.email,
      }
    : undefined,
});

const generateToken = () => crypto.randomBytes(32).toString('hex');

const isPastExpiry = (invitation) =>
  invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now();

const withLazyExpiry = async (invitation) => {
  if (!invitation) return invitation;
  if (!TERMINAL_STATUSES.includes(invitation.status) && isPastExpiry(invitation)) {
    return repo.setStatus(invitation.id, 'EXPIRED');
  }
  return invitation;
};

const assertNotTerminal = (invitation) => {
  if (TERMINAL_STATUSES.includes(invitation.status)) {
    throw new BadRequestError(
      `Invitation is already ${invitation.status.toLowerCase()} and cannot be updated further.`
    );
  }
};

/**
 * Mirrors an invitation transition onto the candidate's own status.
 * Deliberately best-effort: errors are swallowed and logged rather than
 * thrown, so a sync mismatch never fails the invitation transition itself.
 */
const syncCandidateStatus = async ({ candidate, action }) => {
  if (!candidate) return;
  try {
    if (action === 'start') {
      await candidateService.start({ id: candidate.id, companyId: candidate.companyId });
    } else if (action === 'complete') {
      await candidateService.complete({ id: candidate.id, companyId: candidate.companyId });
    } else if (action === 'expire') {
      await candidateService.expire({ id: candidate.id, companyId: candidate.companyId });
    }
  } catch (err) {
    logger.warn(
      `Invitation ${action}: could not sync candidate ${candidate.id} status — ${err.message}`
    );
  }
};

/**
 * NEW — Sends (or re-sends) the invitation email. Best-effort: a failed
 * send is logged but never fails the invitation create/resend itself —
 * the invitation still exists and can be resent or the link shared
 * manually from the admin UI.
 */
const sendInvitationEmail = async ({ candidate, companyId, token, expiresAt }) => {
  if (!candidate?.email) {
    logger.warn(`Invitation email skipped: candidate ${candidate?.id} has no email on file`);
    return;
  }
  try {
    const company = await companyRepo.findById(companyId);
    const inviteUrl = `${config.frontendUrl}/invite/${token}`;
    const mail = buildCandidateInvitationEmail({
      candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
      companyName: company?.name || 'Our team',
      inviteUrl,
      expiresAt,
    });
    await sendMail({ to: candidate.email, ...mail });
  } catch (err) {
    logger.error(`Failed to send candidate invitation email: ${err.message}`);
  }
};

/**
 * Create Invitation
 */
const create = async ({ payload, companyId, currentUser }) => {
  const { candidateId, expiresInHours } = payload;

  const candidate = await candidateRepo.findById(candidateId, companyId);
  if (!candidate) {
    throw new NotFoundError('Candidate not found');
  }

  const existingActive = await repo.findActiveByCandidate(candidateId);
  if (existingActive) {
    throw new ConflictError(
      'This candidate already has an active invitation. Resend or expire it first.'
    );
  }

  const expiresAt = new Date(
    Date.now() + (expiresInHours || DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000
  );

  const invitation = await repo.create({
    candidateId,
    token: generateToken(),
    status: 'SENT',
    expiresAt,
  });

  // Fire-and-forget from the caller's perspective, but awaited here so
  // any failure is captured in this request's logs rather than an
  // unhandled rejection later. Never throws.
  await sendInvitationEmail({ candidate, companyId, token: invitation.token, expiresAt });

  return toDto({ ...invitation, candidate });
};

/**
 * Get Invitation By Id (company-scoped, for admin views)
 */
const getById = async ({ id, companyId }) => {
  const invitation = await repo.findById(id, companyId);
  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }
  const fresh = await withLazyExpiry(invitation);
  return toDto({ ...fresh, candidate: invitation.candidate });
};

/**
 * Get Invitation By Token (public — candidate-facing)
 */
const getByToken = async ({ token }) => {
  const invitation = await repo.findByToken(token);
  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }
  const fresh = await withLazyExpiry(invitation);
  return toDto({ ...fresh, candidate: invitation.candidate });
};

/**
 * List Invitations
 */
const list = async ({ companyId, query }) => {
  const result = await repo.list({
    companyId,
    candidateId: query.candidateId,
    status: query.status,
    skip: query.skip,
    limit: query.limit,
    sortBy: ['status', 'expiresAt', 'createdAt', 'updatedAt'].includes(query.sortBy)
      ? query.sortBy
      : 'createdAt',
    sortOrder: query.sortOrder,
  });

  return {
    items: result.items.map(toDto),
    total: result.total,
  };
};

/**
 * Start Invitation (SENT -> STARTED) — candidate opens the link.
 * Also flips Candidate.status INVITED -> IN_PROGRESS.
 */
const start = async ({ token }) => {
  const invitation = await repo.findByToken(token);
  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }

  const fresh = await withLazyExpiry(invitation);
  assertNotTerminal(fresh);

  if (fresh.status === 'STARTED') {
    throw new BadRequestError('Invitation has already been started.');
  }

  const updated = await repo.setStatus(fresh.id, 'STARTED');

  await syncCandidateStatus({ candidate: invitation.candidate, action: 'start' });

  return toDto({ ...updated, candidate: invitation.candidate });
};

/**
 * Complete Invitation (-> COMPLETED).
 * Also flips Candidate.status -> COMPLETED.
 */
const complete = async ({ token }) => {
  const invitation = await repo.findByToken(token);
  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }

  const fresh = await withLazyExpiry(invitation);
  assertNotTerminal(fresh);

  const updated = await repo.setStatus(fresh.id, 'COMPLETED');

  await syncCandidateStatus({ candidate: invitation.candidate, action: 'complete' });

  return toDto({ ...updated, candidate: invitation.candidate });
};

/**
 * Expire Invitation (admin action, by id).
 * Also flips Candidate.status -> EXPIRED.
 */
const expire = async ({ id, companyId }) => {
  const invitation = await repo.findById(id, companyId);
  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }

  assertNotTerminal(invitation);

  const updated = await repo.setStatus(id, 'EXPIRED');

  await syncCandidateStatus({ candidate: invitation.candidate, action: 'expire' });

  return toDto({ ...updated, candidate: invitation.candidate });
};

/**
 * Resend Invitation — regenerates the token and pushes the expiry out,
 * then re-sends the email with the fresh link. Only allowed while still
 * SENT. No candidate status change: the candidate is still just INVITED.
 */
const resend = async ({ id, companyId, expiresInHours }) => {
  const invitation = await repo.findById(id, companyId);
  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }

  if (invitation.status !== 'SENT') {
    throw new BadRequestError('Only a pending (SENT) invitation can be resent.');
  }

  const expiresAt = new Date(
    Date.now() + (expiresInHours || DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000
  );

  const updated = await repo.update(id, {
    token: generateToken(),
    expiresAt,
  });

  await sendInvitationEmail({
    candidate: invitation.candidate,
    companyId,
    token: updated.token,
    expiresAt,
  });

  return toDto({ ...updated, candidate: invitation.candidate });
};

module.exports = {
  create,
  getById,
  getByToken,
  list,
  start,
  complete,
  expire,
  resend,
};