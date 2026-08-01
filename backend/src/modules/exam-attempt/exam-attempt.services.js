'use strict';

const { prisma } = require('../../common/prisma');

const invitationRepo = require('../candidate-invitation/candidate-invitation.repository');
const answerRepo = require('../candidate-answer/candidate-answer.repository');
const invitationService = require('../candidate-invitation/candidate-invitation.services');
const assessmentResultService = require('../assessment-result/assessment-result.services');

const repo = require('./exam-attempt.repository');
const randomQuestionService = require('../question/question.random.service');

const {
    NotFoundError,
    BadRequestError,
} = require('../../utils/errors');

const logger = require('../../common/logger');

const TERMINAL_STATUSES = [
    'SUBMITTED',
    'EXPIRED',
];

/**
 * DTO
 */
const toDto = (attempt) => {

    const remainingSeconds = attempt.expiresAt
        ? Math.max(
            0,
            Math.floor(
                (new Date(attempt.expiresAt).getTime() - Date.now()) / 1000
            )
        )
        : 0;

    const remainingMinutes = Math.floor(remainingSeconds / 60);

    const remainingTime =
        `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

    return {

        id: attempt.id,

        companyId: attempt.companyId,

        candidateId: attempt.candidateId,

        assessmentId: attempt.assessmentId,

        startedAt: attempt.startedAt,

        submittedAt: attempt.submittedAt,

        expiresAt: attempt.expiresAt,

        status: attempt.status,

        selectedQuestions: attempt.selectedQuestions,

        createdAt: attempt.createdAt,

        updatedAt: attempt.updatedAt,

        remainingSeconds,

        remainingMinutes,

        remainingTime,

        candidate: attempt.candidate
            ? {
                  id: attempt.candidate.id,
                  firstName: attempt.candidate.firstName,
                  lastName: attempt.candidate.lastName,
                  email: attempt.candidate.email,
              }
            : undefined,
    };
};

/**
 * Check expiry
 */
const isPastExpiry = (attempt) =>
    attempt.expiresAt &&
    new Date(attempt.expiresAt).getTime() < Date.now();

/**
 * Lazy Expiry
 */
const withLazyExpiry = async (attempt) => {

    if (!attempt) {
        return null;
    }

    if (
        !TERMINAL_STATUSES.includes(attempt.status) &&
        isPastExpiry(attempt)
    ) {
        return repo.setStatus(
            attempt.id,
            'EXPIRED'
        );
    }

    return attempt;
};

/**
 * Prevent update on terminal state
 */
const assertNotTerminal = (attempt) => {

    if (
        TERMINAL_STATUSES.includes(
            attempt.status
        )
    ) {
        throw new BadRequestError(
            `Attempt already ${attempt.status.toLowerCase()}.`
        );
    }
};

/**
 * Sync invitation status
 */
const syncInvitation = async ({
    token,
    action,
}) => {

    try {

        if (action === 'start') {

            await invitationService.start({
                token,
            });

        } else if (action === 'complete') {

            await invitationService.complete({
                token,
            });

        }

    } catch (err) {

        logger.warn(
            `Invitation sync failed : ${err.message}`
        );

    }

};

/**
 * Start / Resume Attempt
 */
const startByToken = async ({ token }) => {

    const invitation =
        await invitationRepo.findByToken(
            token
        );

    if (!invitation) {
        throw new NotFoundError(
            'Invitation not found'
        );
    }

    if (
        invitation.status === 'EXPIRED' ||
        (
            invitation.expiresAt &&
            new Date(invitation.expiresAt) <
                new Date()
        )
    ) {
        throw new BadRequestError(
            'Invitation expired.'
        );
    }

    if (
        invitation.status === 'COMPLETED'
    ) {
        throw new BadRequestError(
            'Assessment already completed.'
        );
    }

    const candidate =
        invitation.candidate;

    let attempt =
        await repo.findByCandidateAndAssessment(
            candidate.id,
            candidate.assessmentId
        );

    /**
     * Resume Existing Attempt
     */
    if (attempt) {

        attempt =
            await withLazyExpiry(
                attempt
            );

        if (
            attempt.status ===
            'EXPIRED'
        ) {
            throw new BadRequestError(
                'Attempt expired.'
            );
        }

        return toDto(attempt);
    }

    /**
     * Load Assessment
     */
    const assessment =
        await prisma.assessment.findUnique({
            where: {
                id: candidate.assessmentId,
            },
            select: {
                level: true,
                durationMinutes: true,
                likertCount: true,
                sjqCount: true,
                forcedChoiceCount: true,
            },
        });

    if (!assessment) {

        throw new BadRequestError(
            'Assessment not found'
        );

    }

    /**
     * Random Questions
     */
    const selectedQuestions =
        randomQuestionService.generateQuestionSet({

            level:
                assessment.level,

            likertCount:
                assessment.likertCount,

            sjqCount:
                assessment.sjqCount,

            forcedChoiceCount:
                assessment.forcedChoiceCount,

        });

    const startedAt =
        new Date();

    const expiresAt =
        new Date(
            startedAt.getTime() +
            assessment.durationMinutes *
                60 *
                1000
        );

    /**
     * Create Attempt
     */
    attempt =
        await repo.create({

            companyId:
                candidate.companyId,

            candidateId:
                candidate.id,

            assessmentId:
                candidate.assessmentId,

            startedAt,

            expiresAt,

            status:
                'IN_PROGRESS',

            selectedQuestions,

        });

    /**
     * Sync Invitation
     */
    await syncInvitation({

        token,

        action: 'start',

    });

    return toDto(
        attempt
    );

};

/**
 * Get Attempt By Token
 * Used by frontend to resume exam.
 * Automatically submits exam if timer has expired.
 */
const getByToken = async ({ token }) => {

    const invitation =
        await invitationRepo.findByToken(token);

    if (!invitation) {
        throw new NotFoundError(
            "Invitation not found"
        );
    }

    const candidate =
        invitation.candidate;

    let attempt =
        await repo.findByCandidateAndAssessment(
            candidate.id,
            candidate.assessmentId
        );

    if (!attempt) {
        throw new NotFoundError(
            "Attempt not found. Start the assessment first."
        );
    }

    attempt = await withLazyExpiry(attempt);

    /**
     * Auto Submit
     */
    if (attempt.status === "EXPIRED") {

        attempt = await repo.update(
            attempt.id,
            {
                submittedAt: new Date(),
                status: "SUBMITTED",
            }
        );

        await syncInvitation({
            token,
            action: "complete",
        });

        await assessmentResultService.generateForAttemptSafe({
            attemptId: attempt.id,
        });

    }

    return toDto(attempt);

};


/**
 * Manual Submit
 */
const submitByToken = async ({ token }) => {

    const invitation =
        await invitationRepo.findByToken(token);

    if (!invitation) {
        throw new NotFoundError(
            "Invitation not found"
        );
    }

    const candidate =
        invitation.candidate;

    let attempt =
        await repo.findByCandidateAndAssessment(
            candidate.id,
            candidate.assessmentId
        );

    if (!attempt) {
        throw new NotFoundError(
            "Attempt not found."
        );
    }

    attempt =
        await withLazyExpiry(attempt);

    if (attempt.status === "SUBMITTED") {

        throw new BadRequestError(
            "Attempt already submitted."
        );

    }

    /**
     * Timer already finished
     */
    if (attempt.status === "EXPIRED") {

        attempt =
            await repo.update(
                attempt.id,
                {
                    submittedAt: new Date(),
                    status: "SUBMITTED",
                }
            );

        await syncInvitation({
            token,
            action: "complete",
        });

        await assessmentResultService.generateForAttemptSafe({
            attemptId: attempt.id,
        });

        return toDto(attempt);

    }

    /**
     * Normal Submit
     */
    attempt =
        await repo.update(
            attempt.id,
            {
                submittedAt: new Date(),
                status: "SUBMITTED",
            }
        );

    await syncInvitation({
        token,
        action: "complete",
    });

    await assessmentResultService.generateForAttemptSafe({
        attemptId: attempt.id,
    });

    return toDto(attempt);

};


/**
 * Get Attempt By Id (Admin)
 */
const getById = async ({ id, companyId }) => {

    let attempt = await repo.findById(id, companyId);

    if (!attempt) {
        throw new NotFoundError("Attempt not found");
    }

    attempt = await withLazyExpiry(attempt);

    return toDto({
        ...attempt,
        candidate: attempt.candidate,
    });

};


/**
 * List Attempts
 */
const list = async ({ companyId, query }) => {

    const result = await repo.list({

        companyId,

        candidateId: query.candidateId,

        assessmentId: query.assessmentId,

        status: query.status,

        skip: query.skip,

        limit: query.limit,

        sortBy: [
            "startedAt",
            "submittedAt",
            "expiresAt",
            "createdAt",
            "updatedAt",
        ].includes(query.sortBy)
            ? query.sortBy
            : "createdAt",

        sortOrder: query.sortOrder,

    });

    return {

        items: result.items.map(toDto),

        total: result.total,

    };

};


/**
 * Expire Attempt (Admin)
 */
const expire = async ({ id, companyId }) => {

    const attempt = await repo.findById(id, companyId);

    if (!attempt) {
        throw new NotFoundError("Attempt not found");
    }

    assertNotTerminal(attempt);

    const updated = await repo.setStatus(
        id,
        "EXPIRED"
    );

    return toDto({
        ...updated,
        candidate: attempt.candidate,
    });

};


/**
 * Candidate Questions
 */
const getQuestions = async ({ token }) => {

    const invitation =
        await invitationRepo.findByToken(token);

    if (!invitation) {
        throw new NotFoundError(
            "Invitation not found"
        );
    }

    const candidate = invitation.candidate;

    const attempt =
        await repo.findByCandidateAndAssessment(
            candidate.id,
            candidate.assessmentId
        );

    if (!attempt) {
        throw new NotFoundError(
            "Attempt not found."
        );
    }

    const loader = require("../question/question.loader");

    const result = {};

    for (const type of Object.keys(attempt.selectedQuestions)) {

        result[type] =
            attempt.selectedQuestions[type].map(id =>
                loader.getQuestionById(id)
            );

    }

    return result;

};


/**
 * Admin View Selected Questions
 */
const getSelectedQuestions = async ({
    id,
    companyId,
}) => {

    const attempt =
        await repo.findById(
            id,
            companyId
        );

    if (!attempt) {
        throw new NotFoundError(
            "Attempt not found"
        );
    }

    return attempt.selectedQuestions;

};


/**
 * Resume Exam
 */
const resumeExam = async ({ token }) => {

    const invitation =
        await invitationRepo.findByToken(token);

    if (!invitation) {
        throw new NotFoundError(
            "Invitation not found"
        );
    }

    let attempt =
        await repo.findByCandidateAndAssessment(
            invitation.candidate.id,
            invitation.candidate.assessmentId
        );

    if (!attempt) {
        throw new NotFoundError(
            "Attempt not found"
        );
    }

    attempt =
        await withLazyExpiry(attempt);

    /**
     * Auto submit if expired
     */
    if (attempt.status === "EXPIRED") {

        attempt = await repo.update(
            attempt.id,
            {
                submittedAt: new Date(),
                status: "SUBMITTED",
            }
        );

        await syncInvitation({
            token,
            action: "complete",
        });

        await assessmentResultService.generateForAttemptSafe({
            attemptId: attempt.id,
        });

    }

    const answers =
        await answerRepo.listByAttempt(
            attempt.id
        );

    const answered = answers.length;

    const total = Object.values(
        attempt.selectedQuestions || {}
    )
        .flat()
        .length;

    const remainingSeconds = Math.max(
        0,
        Math.floor(
            (
                new Date(attempt.expiresAt).getTime() -
                Date.now()
            ) / 1000
        )
    );

    return {

        candidate: attempt.candidate,

        assessment: attempt.assessment,

        attempt: {

            id: attempt.id,

            status: attempt.status,

            startedAt: attempt.startedAt,

            expiresAt: attempt.expiresAt,

            remainingSeconds,

            remainingMinutes:
                Math.floor(
                    remainingSeconds / 60
                ),

            remainingTime:
                `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`,

        },

        selectedQuestions:
            attempt.selectedQuestions,

        answers,

        progress: {

            answered,

            total,

            percentage:
                total === 0
                    ? 0
                    : Math.round(
                          (answered * 100) /
                              total
                      ),

        },

    };

};


module.exports = {

    startByToken,

    getByToken,

    submitByToken,

    getById,

    list,

    expire,

    getQuestions,

    getSelectedQuestions,

    resumeExam,

};