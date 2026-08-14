'use strict';

const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/* ================================================================== */
/*  Brand palette — same values as result.pdf.js, duplicated here      */
/*  rather than imported because that module doesn't currently export  */
/*  them. If you're comfortable refactoring, pull COLORS, scoreColor,  */
/*  scoreBand, resolveUploadsPath, loadLocalLogo, and drawLogoBox out   */
/*  into a shared `pdf-helpers.js` and have both files import from it  */
/*  — that removes this duplication entirely.                          */
/* ================================================================== */

const COLORS = {
  brandDark: '#0B0F26',
  accent: '#0E7C6B',
  heading: '#0b3b66',
  neutral: '#111827',
  gray: '#4b5563',
  lightGray: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e2e8f0',
  gold: '#b8860b',
  goldLight: '#d4af37',
};

const scoreColor = (score) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

const scoreBand = (score) => {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Satisfactory';
  return 'Needs Improvement';
};

const COMPANY_NAME = 'Brainhunt Ventures Pvt Ltd.';

/* ================================================================== */
/*  Logo resolution — identical logic to result.pdf.js                 */
/* ================================================================== */

const resolveUploadsPath = (url) => {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      trimmed = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  const relative = trimmed.replace(/^\/+/, '');
  const uploadsIndex = relative.indexOf('uploads/');
  if (uploadsIndex === -1) return null;
  const normalizedRelative = relative.slice(uploadsIndex);

  const candidate = path.resolve(__dirname, '../../../', normalizedRelative);
  return fs.existsSync(candidate) ? candidate : null;
};

const loadLocalLogo = (logoUrl) => {
  const filePath = resolveUploadsPath(logoUrl);
  if (!filePath) return null;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') {
    try {
      return { type: 'svg', content: fs.readFileSync(filePath, 'utf8') };
    } catch {
      return null;
    }
  }
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') {
    return { type: 'png', filePath };
  }
  return null;
};

const drawLogoBox = (doc, SVGtoPDF, logo, x, y, size) => {
  if (!logo) return false;
  try {
    if (logo.type === 'svg' && SVGtoPDF) {
      SVGtoPDF(doc, logo.content, x, y, { width: size, height: size, assumePt: true, preserveAspectRatio: 'xMidYMid meet' });
      return true;
    }
    if (logo.type === 'png') {
      doc.image(logo.filePath, x, y, { fit: [size, size], align: 'center', valign: 'center' });
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

/* ================================================================== */
/*  Small drawing helpers specific to the certificate layout           */
/* ================================================================== */

/**
 * A short, human-presentable verification code — not a security token,
 * just something a candidate/employer can quote when asking someone to
 * confirm a certificate is genuine. Deterministic per attempt, so
 * re-generating the same certificate always produces the same code.
 */
const buildCertificateNumber = ({ candidateId, assessmentId, submittedAt }) => {
  const seed = `${candidateId ?? ''}:${assessmentId ?? ''}:${submittedAt ?? ''}`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex').toUpperCase();
  return `HA-${hash.slice(0, 10)}`;
};

/** Ornate double-line border frame with squared corner accents. */
const drawCertificateFrame = (doc, pageWidth, pageHeight) => {
  const outer = 22;
  const inner = 30;

  doc.save();
  doc.lineWidth(1.4).strokeColor(COLORS.goldLight);
  doc.rect(outer, outer, pageWidth - outer * 2, pageHeight - outer * 2).stroke();
  doc.restore();

  doc.save();
  doc.lineWidth(0.75).strokeColor(COLORS.border);
  doc.rect(inner, inner, pageWidth - inner * 2, pageHeight - inner * 2).stroke();
  doc.restore();

  const cornerLen = 26;
  const corners = [
    [outer, outer, 1, 1],
    [pageWidth - outer, outer, -1, 1],
    [outer, pageHeight - outer, 1, -1],
    [pageWidth - outer, pageHeight - outer, -1, -1],
  ];
  corners.forEach(([cx, cy, dx, dy]) => {
    doc.save();
    doc.lineWidth(2.2).strokeColor(COLORS.gold);
    doc.moveTo(cx, cy + dy * cornerLen).lineTo(cx, cy).lineTo(cx + dx * cornerLen, cy).stroke();
    doc.restore();
  });
};

/** Centred accent divider — a short two-tone line used under the candidate name and section labels. */
const drawAccentDivider = (doc, centerX, y, width = 90) => {
  const half = width / 2;
  doc.save();
  doc.lineWidth(2).strokeColor(COLORS.gold).moveTo(centerX - half, y).lineTo(centerX, y).stroke();
  doc.lineWidth(2).strokeColor(COLORS.accent).moveTo(centerX, y).lineTo(centerX + half, y).stroke();
  doc.restore();
};

/** A logo (or a monogram fallback when no logo is on file) with a caption underneath, used in the three-party row. */
const drawEntityBadge = (doc, SVGtoPDF, centerX, y, size, logo, name, caption) => {
  const drawn = logo ? drawLogoBox(doc, SVGtoPDF, logo, centerX - size / 2, y, size) : false;

  if (!drawn) {
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    doc.save();
    doc.circle(centerX, y + size / 2, size / 2).fillOpacity(0.1).fill(COLORS.heading);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(size * 0.4).fillColor(COLORS.heading);
    doc.text(initial, centerX - size / 2, y + size / 2 - (size * 0.4) / 2 - 1, {
      width: size,
      align: 'center',
      lineBreak: false,
    });
  }

  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text(caption.toUpperCase(), centerX - 80, y + size + 8, {
    width: 160,
    align: 'center',
    characterSpacing: 0.3,
    lineBreak: false,
  });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.neutral).text(name, centerX - 90, y + size + 19, {
    width: 180,
    align: 'center',
    lineBreak: false,
  });
};

/** A labelled signature line: a horizontal rule with a caption underneath. */
const drawSignatureLine = (doc, x, y, width, label, value) => {
  doc.save();
  doc.lineWidth(0.75).strokeColor(COLORS.border).moveTo(x, y).lineTo(x + width, y).stroke();
  doc.restore();
  if (value) {
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.neutral).text(value, x, y - 16, { width, align: 'center', lineBreak: false });
  }
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray).text(label.toUpperCase(), x, y + 6, {
    width,
    align: 'center',
    characterSpacing: 0.4,
    lineBreak: false,
  });
};

/* ================================================================== */
/*  Certificate generation                                              */
/* ================================================================== */

/**
 * Generates a single-page landscape certificate for a completed
 * assessment attempt. Expects the same `bundle` shape used by
 * generateResultPdf in result.pdf.js: bundle.candidate, bundle.assessment
 * (with .client and .level), bundle.company, bundle.overallScore,
 * bundle.submittedAt.
 */
const generateCertificatePdf = ({ bundle }) => {
  let SVGtoPDF = null;
  try {
    SVGtoPDF = require('svg-to-pdfkit');
  } catch {
    SVGtoPDF = null;
  }

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 0, bottom: 0, left: 0, right: 0 }, autoFirstPage: false });
  doc.addPage();

  const pageWidth = doc.page.width; // 841.89
  const pageHeight = doc.page.height; // 595.28
  const centerX = pageWidth / 2;

  const candidate = bundle.candidate;
  const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : 'Unknown Candidate';
  const assessmentName = bundle.assessment?.name ?? 'Unknown Assessment';
  const level = bundle.assessment?.level ?? null;
  const companyName = bundle.company?.name ?? 'Unknown Company';
  const clientName = bundle.assessment?.client?.name ?? 'Unknown Client';
  const overallScore = typeof bundle.overallScore === 'number' ? Math.round(bundle.overallScore) : 0;
  const grade = bundle.report?.overall?.band ?? scoreBand(overallScore);
  const gradeColor = scoreColor(overallScore);
  const submittedAt = bundle.submittedAt ? new Date(bundle.submittedAt) : new Date();
  const issueDateLabel = submittedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const certificateNumber = buildCertificateNumber({
    candidateId: candidate?.id,
    assessmentId: bundle.assessment?.id,
    submittedAt: bundle.submittedAt,
  });

  const companyLogo = loadLocalLogo(bundle.company?.logoUrl);
  const clientLogo = loadLocalLogo(bundle.assessment?.client?.logoUrl);

  /* ---------------------------- frame + watermark ---------------------------- */

  drawCertificateFrame(doc, pageWidth, pageHeight);

  doc.save();
  doc.rotate(-18, { origin: [centerX, pageHeight / 2] });
  doc.font('Helvetica-Bold').fontSize(150).fillOpacity(0.035).fillColor(COLORS.heading);
  doc.text('HIREASSESS', 0, pageHeight / 2 - 90, { width: pageWidth, align: 'center', lineBreak: false });
  doc.restore();

  /* ---------------------------- header: wordmark + certificate no. ---------------------------- */

  const headerY = 46;
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.brandDark).text('Hire', 60, headerY, { continued: true, lineBreak: false });
  doc.fillColor(COLORS.accent).text('Assess', { continued: false, lineBreak: false });
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text('ASSESSMENT & TRAINING INSIGHTS PLATFORM', 60, headerY + 20, { characterSpacing: 0.4, lineBreak: false });

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray).text(`Certificate No. ${certificateNumber}`, pageWidth - 260, headerY, { width: 200, align: 'right', lineBreak: false });
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray).text(`Issued ${issueDateLabel}`, pageWidth - 260, headerY + 13, { width: 200, align: 'right', lineBreak: false });

  /* ---------------------------- title block ---------------------------- */

  let y = 96;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.gold).text('CERTIFICATE OF ACHIEVEMENT', 0, y, {
    width: pageWidth,
    align: 'center',
    characterSpacing: 2.5,
    lineBreak: false,
  });

  y += 30;
  doc.font('Helvetica-Oblique').fontSize(11).fillColor(COLORS.gray).text('This is to certify that', 0, y, {
    width: pageWidth,
    align: 'center',
    lineBreak: false,
  });

  y += 26;
  doc.font('Helvetica-Bold').fontSize(30).fillColor(COLORS.neutral).text(candidateName, 60, y, {
    width: pageWidth - 120,
    align: 'center',
    lineBreak: false,
  });

  y += 42;
  drawAccentDivider(doc, centerX, y, 110);

  /* ---------------------------- body paragraph ---------------------------- */

  y += 22;
  const levelClause = level ? ` (Level ${level})` : '';
  const bodyText =
    `has successfully completed the ${assessmentName}${levelClause} assessment, administered by HireAssess on behalf of ${clientName}, ` +
    `and achieved an overall score of ${overallScore} out of 100 — a performance graded as ${grade}. ` +
    `This certificate is issued in recognition of the skills and aptitude demonstrated throughout the assessment.`;

  doc.font('Helvetica').fontSize(11.5).fillColor(COLORS.gray).text(bodyText, 130, y, {
    width: pageWidth - 260,
    align: 'center',
    lineGap: 5,
  });

  /* ---------------------------- score + grade badge ---------------------------- */

  y = doc.y + 22;
  const badgeR = 34;
  const badgeCX = centerX;
  const badgeCY = y + badgeR;

  doc.save();
  doc.circle(badgeCX, badgeCY, badgeR).fillOpacity(0.09).fill(gradeColor);
  doc.restore();
  doc.circle(badgeCX, badgeCY, badgeR).lineWidth(2).strokeColor(gradeColor).stroke();
  doc.font('Helvetica-Bold').fontSize(22).fillColor(gradeColor).text(String(overallScore), badgeCX - badgeR, badgeCY - 18, {
    width: badgeR * 2,
    align: 'center',
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray).text('/ 100', badgeCX - badgeR, badgeCY + 8, {
    width: badgeR * 2,
    align: 'center',
    lineBreak: false,
  });

  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(gradeColor).text(grade.toUpperCase(), badgeCX + badgeR + 14, badgeCY - 6, {
    width: 150,
    characterSpacing: 0.6,
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.lightGray).text('Overall recommendation band', badgeCX + badgeR + 14, badgeCY + 8, {
    width: 150,
    lineBreak: false,
  });

  /* ---------------------------- three-party logo row ---------------------------- */

  const rowY = badgeCY + badgeR + 30;
  const logoSize = 44;
  const slotCenters = [centerX - 220, centerX, centerX + 220];

  drawEntityBadge(doc, SVGtoPDF, slotCenters[0], rowY, logoSize, companyLogo, companyName, 'Assessment Partner');

  doc.save();
  doc.circle(slotCenters[1], rowY + logoSize / 2, logoSize / 2).fillOpacity(0.12).fill(COLORS.accent);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.brandDark).text('H', slotCenters[1] - logoSize / 2, rowY + logoSize / 2 - 8, {
    width: logoSize,
    align: 'center',
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text('CERTIFYING PLATFORM', slotCenters[1] - 80, rowY + logoSize + 8, {
    width: 160,
    align: 'center',
    characterSpacing: 0.3,
    lineBreak: false,
  });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.neutral).text('HireAssess', slotCenters[1] - 90, rowY + logoSize + 19, {
    width: 180,
    align: 'center',
    lineBreak: false,
  });

  drawEntityBadge(doc, SVGtoPDF, slotCenters[2], rowY, logoSize, clientLogo, clientName, 'Client Organisation');

  /* ---------------------------- signature row ---------------------------- */

  const sigY = pageHeight - 78;
  const sigWidth = 200;
  drawSignatureLine(doc, 100, sigY, sigWidth, 'Authorised Signatory', 'HireAssess Assessments');
  drawSignatureLine(doc, centerX - sigWidth / 2, sigY, sigWidth, 'Date of Issue', issueDateLabel);
  drawSignatureLine(doc, pageWidth - 100 - sigWidth, sigY, sigWidth, 'Verification No.', certificateNumber);

  /* ---------------------------- footer ---------------------------- */

  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text(
    `© ${COMPANY_NAME} All rights reserved.  ·  This certificate reflects performance on a single assessment attempt and is not a guarantee of future performance.`,
    60,
    pageHeight - 34,
    { width: pageWidth - 120, align: 'center', lineBreak: false }
  );

  return doc;
};

module.exports = { generateCertificatePdf };