'use strict';

const examAttemptService = require('../exam-attempt/exam-attempt.services');
const repo = require('./candidate-answer.repository');
const questionRepo = require('../question/question.repository');
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
const scoreAnswer = async ({ category, answer }) => {
  if (
    category === 'LIKERT' &&
    typeof answer?.answer === 'number'
  ) {
    return answer.answer;
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
    category,
    answer,
  } = payload;
  const question = questionLoader.getQuestionById(questionId);

  if (!question) {
    throw new BadRequestError("Question not found.");
  }

  if (questionType === "LIKERT") {

    if (
      typeof answer.answer !== "number" ||
      answer.answer < 1 ||
      answer.answer > 5
    ) {
      throw new BadRequestError(
        "Likert answer must be between 1 and 5."
      );
    }

  }

  if (questionType === "SITUATIONAL_JUDGEMENT") {

    const allowed = ["A", "B", "C", "D"];

    if (!allowed.includes(answer.selectedOption)) {
      throw new BadRequestError(
        "Invalid SJQ option."
      );
    }

  }

  if (questionType === "FORCED_CHOICE") {

    if (
      !answer.most ||
      !answer.least
    ) {
      throw new BadRequestError(
        "Most and Least are required."
      );
    }

    if (answer.most === answer.least) {
      throw new BadRequestError(
        "Most and Least cannot be the same."
      );
    }

  }

  const pool =
    attempt.selectedQuestions?.[category] || [];

  if (!pool.includes(questionId)) {
    throw new BadRequestError(
      'This question is not part of this attempt.'
    );
  }

  const score = await scoreAnswer({
    category,
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