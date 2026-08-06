'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../common/logger');

/**
 * Gmail's SMTP address strips whitespace from the app password when you
 * copy it out of the Google Account UI, but people often paste it with
 * the spaces still in (e.g. "abcd efgh ijkl mnop"). Nodemailer usually
 * tolerates this, but stripping it here removes one class of "why won't
 * this authenticate" bug entirely.
 */
const cleanPassword = (value) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value);

const smtpConfig = {
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  user: config.smtp.user,
  password: cleanPassword(config.smtp.password),
  fromName: config.smtp.fromName,
  fromEmail: config.smtp.fromEmail,
};

/**
 * Fails loudly, at startup, for the two mistakes that most commonly
 * cause "the invitation is created but no email ever arrives":
 *   1. Missing SMTP config entirely.
 *   2. SMTP_FROM_EMAIL that doesn't match SMTP_USER (or its domain) —
 *      most providers (Gmail included) reject or silently mangle a send
 *      where the From header isn't the authenticated account or a
 *      verified alias on it, and the failure only shows up in the SMTP
 *      response, not in your application code.
 */
const validateSmtpConfig = () => {
  const missing = ['host', 'port', 'user', 'password', 'fromEmail', 'fromName'].filter(
    (key) => !smtpConfig[key]
  );
  if (missing.length) {
    logger.error(`Mailer: missing required SMTP config: ${missing.join(', ')}. Emails will not send.`);
    return false;
  }

  if (smtpConfig.fromEmail.toLowerCase() !== smtpConfig.user.toLowerCase()) {
    logger.warn(
      `Mailer: SMTP_FROM_EMAIL ("${smtpConfig.fromEmail}") does not match SMTP_USER ` +
        `("${smtpConfig.user}"). Most providers (including Gmail) will reject or mangle sends ` +
        `where the From address isn't the authenticated account or a verified alias on it. ` +
        `If mail silently isn't arriving, this is almost always why — set SMTP_FROM_EMAIL to ` +
        `the same address as SMTP_USER, or add it as a verified "Send mail as" alias in Gmail.`
    );
  }

  return true;
};

const configIsValid = validateSmtpConfig();

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.password,
  },
});

// Fail fast in logs (not on boot) if SMTP creds/host are wrong — doesn't
// throw, just tells you early instead of on the first real send.
if (configIsValid) {
  transporter
    .verify()
    .then(() => logger.info('Mailer: SMTP connection verified'))
    .catch((err) => logger.error(`Mailer: SMTP verification failed — ${err.message}`));
}

const fromHeader = () => `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`;

/**
 * Generic send. Callers pass { to, subject, html, text? }.
 * Never throws-and-crashes the caller's main flow by itself — callers
 * (services) are expected to wrap this in try/catch if the email is
 * best-effort (e.g. don't block invitation creation if mail fails).
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (!to) {
    throw new Error('No recipient email provided');
  }
  if (!configIsValid) {
    throw new Error('SMTP is not configured correctly — see startup logs for the missing/invalid fields.');
  }

  const mailText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  try {
    const info = await transporter.sendMail({
      from: fromHeader(),
      to,
      subject,
      html,
      text: mailText,
    });
    logger.info(`Mailer: sent "${subject}" to ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    logger.error(`Mailer: send failed to ${to} — ${err.message}`);
    throw err;
  }
};

/* ================================================================== */
/*  Shared email shell                                                  */
/*                                                                       */
/*  All templates below render through emailShell() so header, sign-off, */
/*  and footer stay visually consistent instead of being copy-pasted     */
/*  into every builder. Brand colours mirror the PDF report generator.   */
/* ================================================================== */

const BRAND_TEAL = '#3FDCC0';
const BRAND_INK = '#0B0F26';
const BRAND_HEADING = '#12172B';
const BRAND_MUTED = '#5B6280';
const BRAND_BORDER = '#E4E7F0';
const BRAND_WARNING = '#B45309';

const PLATFORM_LOGO_URL = `${config.frontendUrl.replace(/\/$/, '')}/hireassess-logo.svg`;

/**
 * `logoUrl` should be a fully-resolved absolute URL (e.g. a company's
 * uploaded logo already run through whatever asset-URL resolver you use
 * elsewhere in the app). Falls back to the HireAssess mark when no company
 * logo is available, so emails always render with *some* logo.
 */
const emailShell = ({ logoUrl, bodyHtml, signOffName, footerNote }) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 540px; margin: 0 auto; color: ${BRAND_HEADING}; line-height: 1.55;">
    <div style="text-align: center; padding: 8px 0 20px;">
      <img src="${logoUrl || PLATFORM_LOGO_URL}" alt="Logo" style="height: 42px; width: auto; display: inline-block;" />
    </div>
    <div style="background: #ffffff; border: 1px solid ${BRAND_BORDER}; border-radius: 12px; padding: 28px 30px;">
      ${bodyHtml}
      <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid ${BRAND_BORDER};">
        <p style="margin: 0; font-size: 14px; color: ${BRAND_HEADING};">Thanks and regards,</p>
        <p style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: ${BRAND_HEADING};">${signOffName}</p>
      </div>
    </div>
    ${
      footerNote
        ? `<p style="text-align:center; color:${BRAND_MUTED}; font-size: 11px; margin: 16px 8px 0;">${footerNote}</p>`
        : ''
    }
    <p style="text-align:center; color:${BRAND_MUTED}; font-size: 11px; margin: 6px 8px 0;">
      Powered by <span style="color:${BRAND_INK}; font-weight:600;">Hire</span><span style="color:#0E7C6B; font-weight:600;">Assess</span>
    </p>
  </div>
`;

const ctaButton = (href, label) => `
  <a href="${href}" style="display:inline-block; background:${BRAND_TEAL}; color:${BRAND_INK}; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px; margin: 14px 0;">
    ${label}
  </a>
`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:6px 14px 6px 0; color:${BRAND_MUTED}; font-size:13px; white-space:nowrap;">${label}</td>
    <td style="padding:6px 0; font-size:13px; font-weight:600;">${value}</td>
  </tr>
`;

/**
 * Company admin welcome email (referenced by user.service.js). Sent by the
 * platform when a new company admin account is created — accepts an
 * optional `companyLogoUrl` so the header shows the company's own branding
 * once they have a logo, rather than always the HireAssess mark.
 */
const buildCompanyAdminWelcomeEmail = ({ companyName, adminName, email, password, loginUrl, companyLogoUrl }) => ({
  subject: `Welcome to ${companyName} on HireAssess — your account is ready`,
  html: emailShell({
    logoUrl: companyLogoUrl,
    signOffName: 'The HireAssess Team',
    footerNote: `This account was created for you as an administrator of ${companyName} on the HireAssess platform.`,
    bodyHtml: `
      <h2 style="margin:0 0 6px; font-size:20px;">Welcome, ${adminName} 👋</h2>
      <p style="margin:0 0 16px; font-size:14px; color:${BRAND_MUTED};">
        Your administrator account for <strong>${companyName}</strong> has been created on HireAssess — the
        platform your team will use to build role-specific assessments, invite candidates, and review
        trait-level scoring and reports as they come in.
      </p>
      <table style="margin: 4px 0 20px; border-collapse: collapse;">
        ${infoRow('Email', email)}
        ${infoRow('Temporary password', password)}
      </table>
      ${ctaButton(loginUrl, 'Log in to your dashboard')}
      <p style="margin:16px 0 0; font-size:12.5px; color:${BRAND_MUTED};">
        For security, you'll be asked to set a new password the first time you sign in. If the button
        above doesn't work, copy and paste this link into your browser:<br />
        <span style="word-break: break-all;">${loginUrl}</span>
      </p>
    `,
  }),
});

/**
 * Candidate invitation email. Sent when an invitation is created (and
 * again, with a fresh link, when one is resent). `companyLogoUrl` is
 * prioritized over the platform logo here — from the candidate's
 * perspective this invitation is from the company, not from HireAssess.
 * `assessmentName` and `durationMinutes` are optional; when provided they
 * make the email noticeably more specific about what the candidate is
 * about to do.
 */
const buildCandidateInvitationEmail = ({
  candidateName,
  companyName,
  inviteUrl,
  expiresAt,
  assessmentName,
  durationMinutes,
  companyLogoUrl,
}) => {
  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const durationLabel = durationMinutes ? `~${durationMinutes} minutes` : null;
  const assessmentLabel = assessmentName ? `the <strong>${assessmentName}</strong> assessment` : 'an assessment';

  return {
    subject: assessmentName
      ? `${companyName} invited you to complete the ${assessmentName} assessment`
      : `${companyName} invited you to complete an assessment`,
    html: emailShell({
      logoUrl: companyLogoUrl,
      signOffName: `${companyName} Hiring Team`,
      footerNote: `Sent on behalf of ${companyName} via HireAssess.`,
      bodyHtml: `
        <h2 style="margin:0 0 6px; font-size:20px;">Hi ${candidateName},</h2>
        <p style="margin:0 0 14px; font-size:14px; color:${BRAND_MUTED};">
          <strong>${companyName}</strong> has invited you to complete ${assessmentLabel} as part of your
          application. It's a chance to show your strengths in a structured way, alongside your resume —
          the hiring team will use it to get a clearer, more consistent picture of your fit for the role.
        </p>

        ${
          durationLabel
            ? `<table style="margin: 4px 0 14px; border-collapse: collapse;">
                 ${infoRow('Estimated time', durationLabel)}
                 ${infoRow('Format', 'Online, self-paced')}
               </table>`
            : ''
        }

        <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:${BRAND_HEADING};">A few tips before you start:</p>
        <ul style="margin:0 0 16px; padding-left:18px; font-size:13px; color:${BRAND_MUTED};">
          <li style="margin-bottom:4px;">Find a quiet space with a stable internet connection.</li>
          <li style="margin-bottom:4px;">Your progress saves automatically, so a dropped connection won't cost you your answers.</li>
          <li>Answer instinctively — there's no single "correct" way to respond to every question.</li>
        </ul>

        ${ctaButton(inviteUrl, 'Start assessment')}

        ${
          expiryLabel
            ? `<p style="color: ${BRAND_WARNING}; font-size: 13px; font-weight: 600; margin: 10px 0 0;">⏳ This invitation link expires ${expiryLabel}.</p>`
            : ''
        }

        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 20px;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <span style="word-break: break-all;">${inviteUrl}</span>
        </p>
      `,
    }),
  };
};

/**
 * Candidate thank-you email sent after successful submission.
 * `companyLogoUrl` is optional and prioritized over the platform logo for
 * the same reason as the invitation email — this reads as coming from the
 * company whose assessment the candidate just completed.
 */
const buildCandidateThankYouEmail = ({ candidateName, companyName, assessmentName, companyLogoUrl }) => ({
  subject: `Thank you for completing the ${assessmentName} assessment`,
  html: emailShell({
    logoUrl: companyLogoUrl,
    signOffName: `${companyName} Hiring Team`,
    footerNote: `This is a confirmation that your responses for ${companyName} were received successfully.`,
    bodyHtml: `
      <h2 style="margin:0 0 6px; font-size:20px;">Hi ${candidateName},</h2>
      <p style="margin:0 0 14px; font-size:14px; color:${BRAND_MUTED};">
        Thank you for taking the time to complete the <strong>${assessmentName}</strong> assessment for
        <strong>${companyName}</strong>. We've successfully received your responses.
      </p>
      <p style="margin:0 0 14px; font-size:13px; color:${BRAND_MUTED};">
        Your results are now with ${companyName}'s hiring team for review as part of the next steps in
        their process. They'll be in touch if you're moving forward — in the meantime, we genuinely
        appreciate the time and thought you put into this.
      </p>
      <p style="margin:0; font-size:12.5px; color:${BRAND_MUTED};">
        If you have any questions in the meantime, feel free to reply to this email or reach out to the
        hiring team at ${companyName} directly.
      </p>
    `,
  }),
});

module.exports = {
  sendMail,
  buildCompanyAdminWelcomeEmail,
  buildCandidateInvitationEmail,
  buildCandidateThankYouEmail,
};