'use strict';

const examAttemptService = require('../exam-attempt/exam-attempt.services');
const repo = require('./candidate-answer.repository');
const questionLoader = require('../question/question.loader');

const {
  NotFoundError,
  BadRequestError,
} = require('../../utils/errors');

/**
 * DTO
 */
const toDto = (row) => ({
  id: row.id,
  attemptId: row.attemptId,
  questionId: row.questionId,
  questionType: row.questionType,
  category: row.category,
  answer: row.answer,
  score: row.score,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * Temporary scoring
 */
const getSelectedOptionId = (answer) =>
  answer?.selectedOptionId ?? answer?.selectedOption ?? null;

const scoreAnswer = async ({ questionId, questionType, answer }) => {
  const normalizedQuestionType = String(questionType).toUpperCase();
  const question = questionLoader.getQuestionById(questionId);
  if (!question) {
    return null;
  }

  if (normalizedQuestionType === 'LIKERT') {
    const value = answer?.answer;
    if (typeof value === 'number' && value >= 1 && value <= 5) {
      return value;
    }
    return null;
  }

  if (
    normalizedQuestionType === 'SITUATIONAL_JUDGEMENT' ||
    normalizedQuestionType === 'ANALYTICAL' ||
    normalizedQuestionType === 'LOGICAL_REASONING'
  ) {
    const selectedOptionId = getSelectedOptionId(answer);
    if (!selectedOptionId) {
      return null;
    }

    const options = Array.isArray(question.options) ? question.options : [];
    const selected = options.find((opt) => opt.id === selectedOptionId);
    if (!selected) {
      return null;
    }

    return typeof selected.score === 'number' ? selected.score : null;
  }

  if (normalizedQuestionType === 'FORCED_CHOICE') {
    const most = answer?.most ?? answer?.mostLikeId;
    const least = answer?.least ?? answer?.leastLikeId;
    if (!most || !least || most === least) {
      return null;
    }

    const items = Array.isArray(question.items) ? question.items : [];
    const mostItem = items.find((item) => item.id === most);
    const leastItem = items.find((item) => item.id === least);
    if (!mostItem || !leastItem) {
      return null;
    }

    return 2;
  }

  return null;
};

/**
 * Resolve Attempt
 */
const resolveAttempt = async (token) =>
  examAttemptService.getByToken({ token });

/**
 * Save / Update Answer
 */
const upsertByToken = async ({ token, payload }) => {
  const attempt = await resolveAttempt(token);
  if (new Date() > new Date(attempt.expiresAt)) {
    throw new BadRequestError("Exam time has expired.");
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new BadRequestError(
      `Cannot submit answers. Attempt is ${attempt.status}.`
    );
  }

  const {
    questionId,
    questionType,
    category: payloadCategory,
    answer,
  } = payload;
  const normalizedQuestionType = String(questionType).toUpperCase();
  const question = questionLoader.getQuestionById(questionId);

  if (!question) {
    throw new BadRequestError("Question not found.");
  }

  let category = question.category || question.competency || payloadCategory;
  if (!category && normalizedQuestionType === 'FORCED_CHOICE') {
    const items = Array.isArray(question.items) ? question.items : [];
    const mostId = answer?.most ?? answer?.mostLikeId ?? null;
    const matched = items.find((item) => item.id === mostId);
    category = matched?.category || 'Forced Choice';
  }

  if (normalizedQuestionType === 'LIKERT') {
    if (
      typeof answer.answer !== 'number' ||
      answer.answer < 1 ||
      answer.answer > 5
    ) {
      throw new BadRequestError(
        'Likert answer must be between 1 and 5.'
      );
    }
  }

  if (
    normalizedQuestionType === 'SITUATIONAL_JUDGEMENT' ||
    normalizedQuestionType === 'ANALYTICAL' ||
    normalizedQuestionType === 'LOGICAL_REASONING'
  ) {
    const optionIds = Array.isArray(question.options)
      ? question.options.map((opt) => opt.id)
      : [];

    const selectedOptionId = getSelectedOptionId(answer);
    if (!selectedOptionId) {
      throw new BadRequestError(
        `${normalizedQuestionType} answer must include selectedOption.`
      );
    }

    if (!optionIds.includes(selectedOptionId)) {
      throw new BadRequestError(
        `Invalid ${normalizedQuestionType} option.`
      );
    }
  }

  if (normalizedQuestionType === 'FORCED_CHOICE') {
    const most = answer?.most ?? answer?.mostLikeId;
    const least = answer?.least ?? answer?.leastLikeId;

    if (!most || !least) {
      throw new BadRequestError(
        'Most and Least are required.'
      );
    }

    if (most === least) {
      throw new BadRequestError(
        'Most and Least cannot be the same.'
      );
    }
  }

  const pool =
    attempt.selectedQuestions?.[normalizedQuestionType] || [];

  if (!pool.includes(questionId)) {
    throw new BadRequestError(
      'This question is not part of this attempt.'
    );
  }

  const score = await scoreAnswer({
    questionId,
    questionType,
    answer,
  });

  const saved = await repo.upsert({
    attemptId: attempt.id,
    questionId,
    questionType,
    category,
    answer,
    score,
  });

  const answeredCount =
    await repo.countByAttempt(attempt.id);

  const totalQuestions = Object.values(
    attempt.selectedQuestions || {}
  )
    .flat()
    .length;

  return {
    answer: toDto(saved),

    progress: {
      answered: answeredCount,
      total: totalQuestions,
      percentage:
        totalQuestions === 0
          ? 0
          : Math.round(
            (answeredCount * 100) /
            totalQuestions
          ),
    },
  };
};

/**
 * Resume Attempt
 */
const listByToken = async ({ token }) => {
  const attempt = await resolveAttempt(token);

  const answers = await repo.listByAttempt(attempt.id);

  const questionIds = Object.values(
    attempt.selectedQuestions || {}
  ).flat();

  const questions = questionIds.map(id =>
    questionLoader.getQuestionById(id)
  );

  const questionMap = {};

  questions.forEach(question => {

    if (question) {
      questionMap[question.id] = question;
    }

  });
  

  const answeredCount = answers.length;

  const totalQuestions = questionIds.length;

  return {
    attemptId: attempt.id,

    questions: questionIds.map((id) => ({
      question: questionMap[id] || null,
      answer:
        answers.find((a) => a.questionId === id) || null,
    })),

    progress: {
      answered: answeredCount,
      total: totalQuestions,
      percentage:
        totalQuestions === 0
          ? 0
          : Math.round(
            (answeredCount * 100) / totalQuestions
          ),
    },
  };
};
/**
 * Admin Get
 */
const getById = async ({
  id,
  companyId,
}) => {
  const row = await repo.findById(
    id,
    companyId
  );

  if (!row) {
    throw new NotFoundError(
      'Answer not found'
    );
  }

  return toDto(row);
};

/**
 * Admin List
 */
const list = async ({
  companyId,
  query,
}) => {
  const result = await repo.list({
    companyId,
    attemptId: query.attemptId,
    category: query.category,
    questionType: query.questionType,
    skip: query.skip,
    limit: query.limit,
    sortBy: [
      'createdAt',
      'updatedAt',
      'score',
    ].includes(query.sortBy)
      ? query.sortBy
      : 'createdAt',
    sortOrder: query.sortOrder,
  });

  return {
    items: result.items.map(toDto),
    total: result.total,
  };
};

module.exports = {
  upsertByToken,
  listByToken,
  getById,
  list,
};