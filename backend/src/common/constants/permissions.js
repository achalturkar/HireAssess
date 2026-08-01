'use strict';

/**
 * Master list of all permissions.
 * Format:
 * module.action
 */

const PERMISSIONS = [

  // ==========================
  // Dashboard
  // ==========================
  { key: 'dashboard.view', module: 'dashboard', action: 'view', description: 'View dashboard' },

  // ==========================
  // Company
  // ==========================
  { key: 'company.create', module: 'company', action: 'create', description: 'Create companies' },
  { key: 'company.view', module: 'company', action: 'view', description: 'View companies' },
  { key: 'company.update', module: 'company', action: 'update', description: 'Update companies' },
  { key: 'company.delete', module: 'company', action: 'delete', description: 'Delete companies' },
  { key: 'company.activate', module: 'company', action: 'activate', description: 'Activate companies' },
  { key: 'company.inactivate', module: 'company', action: 'inactivate', description: 'Inactivate companies' },

  // ==========================
  // Client
  // ==========================
  { key: 'client.create', module: 'client', action: 'create', description: 'Create clients' },
  { key: 'client.view', module: 'client', action: 'view', description: 'View clients' },
  { key: 'client.update', module: 'client', action: 'update', description: 'Update clients' },
  { key: 'client.delete', module: 'client', action: 'delete', description: 'Delete clients' },
  { key: 'client.activate', module: 'client', action: 'activate', description: 'Activate clients' },
  { key: 'client.inactivate', module: 'client', action: 'inactivate', description: 'Inactivate clients' },

  // ==========================
  // Assessment
  // ==========================
  { key: 'assessment.create', module: 'assessment', action: 'create', description: 'Create assessments' },
  { key: 'assessment.view', module: 'assessment', action: 'view', description: 'View assessments' },
  { key: 'assessment.update', module: 'assessment', action: 'update', description: 'Update assessments' },
  { key: 'assessment.delete', module: 'assessment', action: 'delete', description: 'Delete assessments' },
  { key: 'assessment.publish', module: 'assessment', action: 'publish', description: 'Publish assessments' },
  { key: 'assessment.activate', module: 'assessment', action: 'activate', description: 'Activate assessments' },
  { key: 'assessment.inactivate', module: 'assessment', action: 'inactivate', description: 'Inactivate assessments' },

  // ==========================
  // Candidate
  // ==========================
  { key: 'candidate.create', module: 'candidate', action: 'create', description: 'Create candidates' },
  { key: 'candidate.view', module: 'candidate', action: 'view', description: 'View candidates' },
  { key: 'candidate.update', module: 'candidate', action: 'update', description: 'Update candidates' },
  { key: 'candidate.delete', module: 'candidate', action: 'delete', description: 'Delete candidates' },
  { key: 'candidate.import', module: 'candidate', action: 'import', description: 'Import candidates' },
  { key: 'candidate.export', module: 'candidate', action: 'export', description: 'Export candidates' },



  // ==========================
  // Candidate Invitation
  // ==========================
  {
    key: 'candidate_invitation.create',
    module: 'candidate_invitation',
    action: 'create',
    description: 'Create candidate invitations'
  },
  {
    key: 'candidate_invitation.view',
    module: 'candidate_invitation',
    action: 'view',
    description: 'View candidate invitations'
  },
  {
    key: 'candidate_invitation.update',
    module: 'candidate_invitation',
    action: 'update',
    description: 'Update candidate invitations'
  },
  {
    key: 'candidate_invitation.delete',
    module: 'candidate_invitation',
    action: 'delete',
    description: 'Delete candidate invitations'
  },
  {
    key: 'candidate_invitation.send',
    module: 'candidate_invitation',
    action: 'send',
    description: 'Send candidate invitation emails'
  },
  {
    key: 'candidate_invitation.resend',
    module: 'candidate_invitation',
    action: 'resend',
    description: 'Resend candidate invitation emails'
  },

  // ==========================
  // Test Attempts
  // ==========================
  { key: 'exam_attempt.view', module: 'exam-attempt', action: 'view', description: 'View attempts' },
  { key: 'exam_attempt.reset', module: 'exam-attempt', action: 'reset', description: 'Reset attempts' },
  { key: 'exam_attempt.forceSubmit', module: 'exam-attempt', action: 'forceSubmit', description: 'Force submit attempts' },
  { key: 'exam_attempt.update', module: 'exam-attempt', action: 'forceSubmit', description: 'Force submit attempts' },

  // ==========================
  // Results
  // ==========================
  { key: 'assessment_result.view', module: 'result', action: 'view', description: 'View results' },
  { key: 'assessment_result.export', module: 'result', action: 'export', description: 'Export results' },
  { key: 'assessment_result.download', module: 'result', action: 'download', description: 'Download reports' },


  { key: 'candidate_answer.view', module: 'candiadate-answer', action: 'view', description: 'view answers' },


  

  // ==========================
  // Users
  // ==========================
  { key: 'users.create', module: 'users', action: 'create', description: 'Create users' },
  { key: 'users.view', module: 'users', action: 'view', description: 'View users' },
  { key: 'users.update', module: 'users', action: 'update', description: 'Update users' },
  { key: 'users.delete', module: 'users', action: 'delete', description: 'Delete users' },
  { key: 'users.activate', module: 'users', action: 'activate', description: 'Activate users' },
  { key: 'users.inactivate', module: 'users', action: 'inactivate', description: 'Inactivate users' },

  // ==========================
  // Roles
  // ==========================
  { key: 'roles.create', module: 'roles', action: 'create', description: 'Create roles' },
  { key: 'roles.view', module: 'roles', action: 'view', description: 'View roles' },
  { key: 'roles.update', module: 'roles', action: 'update', description: 'Update roles' },
  { key: 'roles.delete', module: 'roles', action: 'delete', description: 'Delete roles' },

  // ==========================
  // Permissions
  // ==========================
  { key: 'permissions.view', module: 'permissions', action: 'view', description: 'View permissions' },
  { key: 'permissions.assign', module: 'permissions', action: 'assign', description: 'Assign permissions' },

  // ==========================
  // Profile
  // ==========================
  { key: 'profile.view', module: 'profile', action: 'view', description: 'View profile' },
  { key: 'profile.update', module: 'profile', action: 'update', description: 'Update profile' },
  { key: 'profile.changePassword', module: 'profile', action: 'changePassword', description: 'Change password' },

  // ==========================
  // Audit
  // ==========================
  { key: 'audit.view', module: 'audit', action: 'view', description: 'View audit logs' },
];

const PERMISSION_KEYS = PERMISSIONS.reduce((acc, permission) => {
  const constantName = permission.key.toUpperCase().replace(/\./g, '_');
  acc[constantName] = permission.key;
  return acc;
}, {});

const SYSTEM_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  HR: 'HR',
  RECRUITER: 'Recruiter',
  VIEWER: 'Viewer',
};

module.exports = {
  PERMISSIONS,
  PERMISSION_KEYS,
  SYSTEM_ROLES,
};