'use strict';

const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const companyRoutes = require('../modules/company/company.routes');
const roleRoutes = require('../modules/role/role.routes');
const permissionRoutes = require('../modules/permission/permission.routes');
const userRoutes = require('../modules/user/user.routes');
const clientRoutes = require('../modules/client/client.routes');
const healthRoutes = require('../modules/health/health.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const questionRandomRoutes = require('../modules/question/question.random.routes');

const candidateRoutes = require('../modules/candidate/candidate.routes');
const candidateInvitationRoutes = require('../modules/candidate-invitation/candidate-invitation.routes');
const examAttemptRoutes = require('../modules/exam-attempt/exam-attempt.routes');
const candidateAnswerRoutes = require('../modules/candidate-answer/candidate-answer.routes');
const assessmentResultRoutes = require('../modules/assessment-result/assessment-result.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

router.use('/companies', companyRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);

router.use('/assessment', assessmentRoutes);

// NEW
router.use('/question-bank', questionRandomRoutes);

router.use('/candidates', candidateRoutes);
router.use('/candidate-invitation', candidateInvitationRoutes);
router.use('/exam-attempts', examAttemptRoutes);
router.use('/candidate-answers', candidateAnswerRoutes);
router.use(['/assessment-result', '/assessment-results'], assessmentResultRoutes);

module.exports = router;