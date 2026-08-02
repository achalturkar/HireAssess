// 'use strict';

// const nodemailer = require('nodemailer');
// const config = require('../config');

// const transporter = nodemailer.createTransport({
//   host: config.smtp.host || 'smtp.mailtrap.io',
//   port: config.smtp.port || 2525,
//   secure: Boolean(config.smtp.secure),
//   auth: config.smtp.user
//     ? { user: config.smtp.user, pass: config.smtp.password }
//     : undefined,
// });

// const sendMail = async (mailOptions) => {
//   if (!mailOptions?.to) return null;
//   return transporter.sendMail({
//     from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
//     ...mailOptions,
//   });
// };

// const buildCompanyAdminWelcomeEmail = ({ companyName, adminName, email, password, loginUrl }) => ({
//   subject: `Welcome to ${companyName}`,
//   html: `<p>Hello ${adminName},</p><p>Your admin account has been created for ${companyName}.</p><p>Email: ${email}</p><p>Password: ${password}</p><p><a href="${loginUrl}">Login</a></p>`,
//   text: `Hello ${adminName},\nYour admin account has been created for ${companyName}.\nEmail: ${email}\nPassword: ${password}\nLogin: ${loginUrl}`,
// });

// module.exports = { sendMail, buildCompanyAdminWelcomeEmail };

'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../common/logger');

/**
 * Transporter setup — reads from config.smtp, which is sourced from:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD,
 *   SMTP_FROM_NAME, SMTP_FROM_EMAIL
 */
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password,
  },
});

// Fail fast in logs (not on boot) if SMTP creds/host are wrong — doesn't
// throw, just tells you early instead of on the first real send.
transporter
  .verify()
  .then(() => logger.info('Mailer: SMTP connection verified'))
  .catch((err) => logger.error(`Mailer: SMTP verification failed — ${err.message}`));

const fromHeader = () => `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`;

/**
 * Generic send. Callers pass { to, subject, html, text? }.
 * Never throws-and-crashes the caller's main flow by itself — callers
 * (services) are expected to wrap this in try/catch if the email is
 * best-effort (e.g. don't block invitation creation if mail fails).
 */
const sendMail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: fromHeader(),
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  });
  logger.info(`Mailer: sent "${subject}" to ${to} (messageId: ${info.messageId})`);
  return info;
};

/**
 * Existing builder — company admin welcome email (referenced by
 * user.service.js). Included here for completeness / reference.
 */
const buildCompanyAdminWelcomeEmail = ({ companyName, adminName, email, password, loginUrl }) => ({
  subject: `Welcome to ${companyName} — your account is ready`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a2e;">
      <h2 style="margin-bottom: 4px;">Welcome, ${adminName}</h2>
      <p>Your account for <strong>${companyName}</strong> has been created.</p>
      <table style="margin: 16px 0; font-size: 14px;">
        <tr><td style="padding: 4px 12px 4px 0; color: #555;">Email</td><td><strong>${email}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #555;">Temporary password</td><td><strong>${password}</strong></td></tr>
      </table>
      <p>
        <a href="${loginUrl}" style="display: inline-block; background: #3FDCC0; color: #0B0F26; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">
          Log in
        </a>
      </p>
      <p style="color: #777; font-size: 12px; margin-top: 24px;">
        You'll be asked to set a new password on first login.
      </p>
    </div>
  `,
});

/**
 * Candidate invitation email. Sent when an invitation is created (and
 * again, with a fresh link, when one is resent).
 */
const buildCandidateInvitationEmail = ({ candidateName, companyName, inviteUrl, expiresAt }) => {
  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const logoUrl = `${config.frontendUrl.replace(/\/$/, '')}/hireassess-logo.svg`;

  return {
    subject: `${companyName} invited you to complete an assessment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="${logoUrl}" alt="HireAssess" style="height:40px; width:auto; display:inline-block;" />
        </div>
        <h2 style="margin-bottom: 4px;">Hi ${candidateName},</h2>
        <p>${companyName} has invited you to complete an assessment as part of your application.</p>
        <p>
          <a href="${inviteUrl}" style="display: inline-block; background: #3FDCC0; color: #0B0F26; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; margin: 12px 0;">
            Start assessment
          </a>
        </p>
        ${
          expiryLabel
            ? `<p style="color: #b45309; font-size: 13px;">This link expires ${expiryLabel}.</p>`
            : ''
        }
        <p style="color: #777; font-size: 12px; margin-top: 24px;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <span style="word-break: break-all;">${inviteUrl}</span>
        </p>
      </div>
    `,
  };
};

/**
 * Candidate thank-you email sent after successful submission
 */
const buildCandidateThankYouEmail = ({ candidateName, companyName, assessmentName }) => ({
  subject: `Thank you for completing the ${assessmentName} assessment`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 12px;">
        <img src="${config.frontendUrl.replace(/\/$/, '')}/hireassess-logo.svg" alt="HireAssess" style="height:40px; width:auto; display:inline-block;" />
      </div>
      <h2 style="margin-bottom: 4px;">Hi ${candidateName},</h2>
      <p>Thanks for completing the <strong>${assessmentName}</strong> assessment for <strong>${companyName}</strong>. We received your responses and will notify you about the next steps.</p>
      <p style="color: #777; font-size: 12px; margin-top: 18px;">If you have any questions, reply to this email or contact the hiring team at ${companyName}.</p>
    </div>
  `,
});

module.exports = {
  sendMail,
  buildCompanyAdminWelcomeEmail,
  buildCandidateInvitationEmail,
  buildCandidateThankYouEmail,
};
