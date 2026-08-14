'use strict';

const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/* ================================================================== */
/*  Brand palette — same values as result.pdf.js, duplicated here      */
/*  rather than imported because that module doesn't currently export  */
/*  them. If you're comfortable refactoring, pull COLORS, scoreColor,  */
/*  scoreBand, resolveUploadsPath, loadLocalImage, and drawImageFit    */
/*  out into a shared `pdf-helpers.js` and have both files import from */
/*  it — that removes this duplication entirely.                       */
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
  categoryBlue: '#2563eb',
  categoryPurple: '#7c3aed',
};

const scoreColor = (score) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

const scoreBand = (score) => {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Moderate';
  return 'Needs Improvement';
};

const COMPANY_NAME = 'Brainhunt Ventures Pvt Ltd.';

/**
 * Guarantees a non-empty, uppercase-safe string. `??` alone only guards
 * against `undefined`, not `null` — and `report.overall.band` (or any
 * other "optional-looking" field coming out of stored JSON) can very
 * easily be `null` rather than absent. Without this, something like
 * `grade.toUpperCase()` throws deep inside PDF drawing code, after the
 * response may already be underway, and the download just breaks with
 * no useful error on either side.
 */
const safeString = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length ? str : fallback;
};

/* ================================================================== */
/*  Image resolution — used for company logo, client logo, signatory   */
/*  signature, and company stamp. All four are stored the same way     */
/*  (a URL under /uploads/companies/...) so they share one resolver.   */
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

const loadLocalImage = (url) => {
  const filePath = resolveUploadsPath(url);
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

/** Draws an already-loaded image (svg or png) fit inside a width×height box. */
const drawImageFit = (doc, SVGtoPDF, image, x, y, width, height) => {
  if (!image) return false;
  try {
    if (image.type === 'svg' && SVGtoPDF) {
      SVGtoPDF(doc, image.content, x, y, { width, height, assumePt: true, preserveAspectRatio: 'xMidYMid meet' });
      return true;
    }
    if (image.type === 'png') {
      doc.image(image.filePath, x, y, { fit: [width, height], align: 'center', valign: 'bottom' });
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

/** Square-box convenience wrapper over drawImageFit, used for logos/badges. */
const drawLogoBox = (doc, SVGtoPDF, logo, x, y, size) => drawImageFit(doc, SVGtoPDF, logo, x, y, size, size);

/* ================================================================== */
/*  Small generic drawing primitives                                   */
/* ================================================================== */

/** A filled five-point star centred at (cx, cy). Used for the shield badge, the disclaimer bar flourishes, and anywhere else a small gold accent mark is useful. */
const drawStar = (doc, cx, cy, outerR, color, opacity = 1) => {
  const innerR = outerR * 0.42;
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  doc.save();
  doc.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([px, py]) => doc.lineTo(px, py));
  doc.closePath();
  doc.fillOpacity(opacity).fillColor(color).fill();
  doc.fillOpacity(1);
  doc.restore();
};

/**
 * A banner/ribbon shape: a rectangle with pointed "flag" ends, filled
 * with `bgColor` and carrying a single line of centred, letter-spaced
 * text. Used for "THIS IS TO CERTIFY THAT" under the title and for the
 * grade banner under the score medallion.
 */
const drawRibbonBanner = (doc, centerX, y, width, height, text, bgColor, textColor = '#ffffff', fontSize = 9) => {
  const notch = height * 0.55;
  const left = centerX - width / 2;
  const right = centerX + width / 2;

  doc.save();
  doc.fillColor(bgColor);
  doc
    .moveTo(left, y)
    .lineTo(right, y)
    .lineTo(right + notch, y + height / 2)
    .lineTo(right, y + height)
    .lineTo(left, y + height)
    .lineTo(left - notch, y + height / 2)
    .closePath()
    .fill();
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(textColor).text(text, left, y + height / 2 - fontSize / 2 - 1, {
    width,
    align: 'center',
    characterSpacing: 0.8,
    lineBreak: false,
  });
};

/**
 * Draws `text` on a single line, centred in `width`, guaranteed not to
 * wrap. pdfkit's `lineBreak: false` option does not reliably suppress
 * wrapping in every version (verified against the installed one), so
 * this instead shrinks the font size step-by-step until the text fits,
 * and — if it still doesn't fit even at the minimum size — truncates
 * with an ellipsis. Candidate names, company names, and client names
 * are all free-text fields with no length limit at the DB layer, so
 * without this a long one would wrap into a second line and collide
 * with whatever is positioned directly below it.
 */
const drawFittedLine = (doc, text, x, y, width, { font = 'Helvetica-Bold', maxSize = 10, minSize = 7, color = COLORS.neutral, align = 'center', characterSpacing = 0 } = {}) => {
  const value = safeString(text, ' ');
  doc.font(font);
  let size = maxSize;
  while (size > minSize && doc.fontSize(size).widthOfString(value) > width) {
    size -= 0.5;
  }
  let display = value;
  if (doc.fontSize(size).widthOfString(display) > width) {
    while (display.length > 1 && doc.widthOfString(`${display}…`) > width) {
      display = display.slice(0, -1);
    }
    display = `${display.trimEnd()}…`;
  }
  doc.font(font).fontSize(size).fillColor(color).text(display, x, y, { width, align, characterSpacing, lineBreak: false });
};

/** Centred accent divider — a short two-tone line used under the candidate name and section labels. */
const drawAccentDivider = (doc, centerX, y, width = 90) => {
  const half = width / 2;
  doc.save();
  doc.lineWidth(2).strokeColor(COLORS.gold).moveTo(centerX - half, y).lineTo(centerX, y).stroke();
  doc.lineWidth(2).strokeColor(COLORS.accent).moveTo(centerX, y).lineTo(centerX + half, y).stroke();
  doc.restore();
};

/* ================================================================== */
/*  Certificate-specific drawing helpers                               */
/* ================================================================== */

/**
 * A short, human-presentable reference code printed in the header
 * ("Certificate No. HA-XXXXXXXXXX"). Deterministic per attempt, so
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

/* ---- category icons (white glyphs drawn on a filled colour circle) ---- */

const drawBehaviouralIcon = (doc, cx, cy, r) => {
  doc.save();
  doc.fillColor('#ffffff').fillOpacity(0.95);
  doc.circle(cx - r * 0.2, cy - r * 0.12, r * 0.4).fill();
  doc.circle(cx + r * 0.22, cy - r * 0.16, r * 0.32).fill();
  doc.circle(cx, cy + r * 0.2, r * 0.38).fill();
  doc.fillOpacity(1);
  doc.restore();
};

const drawAnalyticalIcon = (doc, cx, cy, r) => {
  doc.save();
  doc.fillColor('#ffffff');
  const barW = r * 0.22;
  const gap = r * 0.14;
  const baseY = cy + r * 0.42;
  [0.35, 0.62, 0.88].forEach((h, i) => {
    const x = cx - r * 0.52 + i * (barW + gap);
    doc.rect(x, baseY - r * h, barW, r * h).fill();
  });
  doc.restore();
};

const drawLogicalIcon = (doc, cx, cy, r, holeColor) => {
  doc.save();
  doc.fillColor('#ffffff');
  doc.circle(cx, cy, r * 0.52).fill();
  const teeth = 6;
  for (let i = 0; i < teeth; i += 1) {
    const angle = (i / teeth) * Math.PI * 2;
    const tx = cx + Math.cos(angle) * r * 0.6;
    const ty = cy + Math.sin(angle) * r * 0.6;
    doc.save();
    doc.translate(tx, ty);
    doc.rotate((angle * 180) / Math.PI);
    doc.rect(-r * 0.09, -r * 0.15, r * 0.18, r * 0.3).fill();
    doc.restore();
  }
  doc.restore();
  doc.save();
  doc.fillColor(holeColor).circle(cx, cy, r * 0.24).fill();
  doc.restore();
};

const CATEGORY_ICONS = {
  behavioural: drawBehaviouralIcon,
  analytical: drawAnalyticalIcon,
  logical: drawLogicalIcon,
};

const DEFAULT_CATEGORIES = [
  {
    key: 'behavioural',
    label: 'Behavioural',
    description: 'Understanding personality, attitude, and workplace behaviour.',
    color: COLORS.accent,
  },
  {
    key: 'analytical',
    label: 'Analytical',
    description: 'Application of data, patterns, and logical analysis.',
    color: COLORS.categoryBlue,
  },
  {
    key: 'logical',
    label: 'Logical',
    description: 'Problem solving, reasoning, and decision-making abilities.',
    color: COLORS.categoryPurple,
  },
];

/** Measures how tall a category column's label + description block will be, without drawing anything, so the caller can size the row before committing to a y position. */
const measureCategoryBlockHeight = (doc, size, category, textWidth) => {
  const labelHeight = 8 + 11; // fixed gap + approx label line height at fontSize 9.5
  const descHeight = doc.font('Helvetica').fontSize(7.8).heightOfString(safeString(category.description, ''), { width: textWidth, lineGap: 2 });
  return size + labelHeight + 10 + descHeight;
};

/** One column of the category row: icon circle, bold label, short description. */
const drawCategoryBadge = (doc, centerX, y, size, category, textWidth) => {
  const color = safeString(category.color, COLORS.heading);
  const iconR = size / 2;

  doc.save();
  doc.circle(centerX, y + iconR, iconR).fill(color);
  doc.restore();

  const iconFn = CATEGORY_ICONS[category.key];
  if (iconFn) {
    iconFn(doc, centerX, y + iconR, iconR, color);
  } else {
    const initial = safeString(category.label, '?').trim().charAt(0).toUpperCase() || '?';
    doc.font('Helvetica-Bold').fontSize(size * 0.4).fillColor('#ffffff');
    doc.text(initial, centerX - iconR, y + iconR - (size * 0.4) / 2 - 1, { width: size, align: 'center', lineBreak: false });
  }

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.heading).text(safeString(category.label).toUpperCase(), centerX - textWidth / 2, y + size + 8, {
    width: textWidth,
    align: 'center',
    characterSpacing: 0.5,
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(7.8).fillColor(COLORS.gray).text(safeString(category.description, ''), centerX - textWidth / 2, y + size + 21, {
    width: textWidth,
    align: 'center',
    lineGap: 2,
  });
};

/**
 * A ring of small tilted leaves around the score circle, echoing a
 * classic laurel-wreath award mark. Purely decorative.
 */
const drawLaurelWreath = (doc, cx, cy, radius, color) => {
  const leafCount = 8;
  const topY = cy - radius * 0.82;
  const bottomY = cy + radius * 0.95;

  [-1, 1].forEach((side) => {
    for (let i = 0; i < leafCount; i += 1) {
      const t = i / (leafCount - 1);
      const ly = topY + t * (bottomY - topY);
      const bulge = radius * 0.16 * Math.sin(t * Math.PI);
      const lx = cx + side * (radius + 9 + bulge);
      const tilt = side * (18 + t * 55);
      const size = 7.5 - t * 2.5;

      doc.save();
      doc.translate(lx, ly);
      doc.rotate(tilt);
      doc.fillOpacity(0.92).fillColor(color);
      doc.ellipse(0, 0, size, size * 0.4).fill();
      doc.fillOpacity(1);
      doc.restore();
    }
  });
};

/** The circular overall-score medallion: laurel wreath, big number, grade ribbon, caption. */
const drawScoreMedallion = (doc, cx, cy, radius, score, grade, gradeColor) => {
  drawLaurelWreath(doc, cx, cy, radius, COLORS.gold);

  doc.save();
  doc.circle(cx, cy, radius).fillOpacity(0.07).fill(gradeColor);
  doc.restore();
  doc.circle(cx, cy, radius).lineWidth(2).strokeColor(gradeColor).stroke();
  doc.circle(cx, cy, radius - 5).lineWidth(0.75).strokeColor(COLORS.goldLight).stroke();

  doc.font('Helvetica-Bold').fontSize(26).fillColor(gradeColor).text(String(score), cx - radius, cy - 20, {
    width: radius * 2,
    align: 'center',
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.gray).text('/ 100', cx - radius, cy + 8, {
    width: radius * 2,
    align: 'center',
    lineBreak: false,
  });

  const ribbonY = cy + radius - 8;
  drawRibbonBanner(doc, cx, ribbonY, 140, 20, grade.toUpperCase(), COLORS.brandDark, COLORS.goldLight, 9.5);

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray).text('OVERALL PERFORMANCE', cx - 90, ribbonY + 28, {
    width: 180,
    align: 'center',
    characterSpacing: 0.6,
    lineBreak: false,
  });
};

/** A shield outline with a gold star — HireAssess's own mark, used as the centre badge of the three-party row. */
const drawShieldBadge = (doc, cx, top, size) => {
  const w = size;
  const h = size * 1.15;

  doc.save();
  doc.fillColor(COLORS.brandDark);
  doc
    .moveTo(cx - w / 2, top)
    .lineTo(cx + w / 2, top)
    .lineTo(cx + w / 2, top + h * 0.55)
    .quadraticCurveTo(cx + w / 2, top + h * 0.88, cx, top + h)
    .quadraticCurveTo(cx - w / 2, top + h * 0.88, cx - w / 2, top + h * 0.55)
    .closePath()
    .fill();
  doc.restore();

  drawStar(doc, cx, top + h * 0.44, size * 0.26, COLORS.gold);
};

/** A logo (or a monogram fallback when no logo is on file) with a caption underneath, used in the two side slots of the three-party row. */
const drawEntityBadge = (doc, SVGtoPDF, centerX, y, size, logo, name, caption) => {
  const safeName = safeString(name, '—');
  const drawn = logo ? drawLogoBox(doc, SVGtoPDF, logo, centerX - size / 2, y, size) : false;

  if (!drawn) {
    const initial = safeName.trim().charAt(0).toUpperCase() || '?';
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

  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text(safeString(caption, '').toUpperCase(), centerX - 90, y + size + 8, {
    width: 180,
    align: 'center',
    characterSpacing: 0.3,
    lineBreak: false,
  });
  drawFittedLine(doc, safeName, centerX - 100, y + size + 19, 200, { font: 'Helvetica-Bold', maxSize: 10, minSize: 7, color: COLORS.neutral });
};

/** The centre slot of the three-party row: HireAssess's own shield mark plus its two-tone wordmark, captioned "Certifying Platform". */
const drawPlatformBadge = (doc, centerX, y, size) => {
  drawShieldBadge(doc, centerX, y, size);

  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text('CERTIFYING PLATFORM', centerX - 90, y + size * 1.15 + 8, {
    width: 180,
    align: 'center',
    characterSpacing: 0.3,
    lineBreak: false,
  });

  const nameY = y + size * 1.15 + 19;
  doc.font('Helvetica-Bold').fontSize(10.5);
  const hireW = doc.widthOfString('Hire');
  const assessW = doc.widthOfString('Assess');
  const startX = centerX - (hireW + assessW) / 2;
  doc.fillColor(COLORS.brandDark).text('Hire', startX, nameY, { continued: true, lineBreak: false });
  doc.fillColor(COLORS.accent).text('Assess', { lineBreak: false });
};

/**
 * A labelled value line: a horizontal rule with a caption underneath and
 * a value printed above it. Used for "Date of Issue".
 */
const drawSignatureLine = (doc, x, y, width, label, value) => {
  doc.save();
  doc.lineWidth(0.75).strokeColor(COLORS.border).moveTo(x, y).lineTo(x + width, y).stroke();
  doc.restore();
  if (value) {
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.neutral).text(value, x, y - 16, { width, align: 'center', lineBreak: false });
  }
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray).text(safeString(label, '').toUpperCase(), x, y + 6, {
    width,
    align: 'center',
    characterSpacing: 0.4,
    lineBreak: false,
  });
};

/**
 * The "Authorized Signatory" column: the real signature image (if the
 * company has one on file) sitting on the rule the way ink would, the
 * signatory's printed name in bold beneath it, and the fixed caption
 * "AUTHORIZED SIGNATORY" underneath that. Falls back to an italic
 * printed name above the line when there's no signature image, and to
 * a blank name line when there's no name either, so the layout never
 * breaks for a company that hasn't set this up yet.
 */
const drawSignatoryBlock = (doc, SVGtoPDF, x, y, width, { name, image }) => {
  const hasName = typeof name === 'string' && name.trim().length > 0;

  if (image) {
    const imgW = Math.min(width - 16, 150);
    const imgH = 38;
    drawImageFit(doc, SVGtoPDF, image, x + (width - imgW) / 2, y - imgH - 4, imgW, imgH);
  } else if (hasName) {
    drawFittedLine(doc, name, x, y - 24, width, { font: 'Helvetica-Oblique', maxSize: 16, minSize: 10, color: COLORS.heading });
  }

  doc.save();
  doc.lineWidth(0.75).strokeColor(COLORS.border).moveTo(x, y).lineTo(x + width, y).stroke();
  doc.restore();

  drawFittedLine(doc, name, x, y + 6, width, { font: 'Helvetica-Bold', maxSize: 10.5, minSize: 8, color: COLORS.neutral });
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text('AUTHORIZED SIGNATORY', x, y + 19, {
    width,
    align: 'center',
    characterSpacing: 0.6,
    lineBreak: false,
  });
};

/**
 * Overlays the company's stamp/seal image at a slight rotation across the
 * signature, the way a physical rubber stamp would sit on a printed page.
 * Purely decorative — skipped entirely when no stamp is on file.
 */
const drawStampOverlay = (doc, SVGtoPDF, image, centerX, centerY, size) => {
  if (!image) return;
  doc.save();
  doc.rotate(-14, { origin: [centerX, centerY] });
  doc.opacity(0.82);
  drawImageFit(doc, SVGtoPDF, image, centerX - size / 2, centerY - size / 2, size, size);
  doc.opacity(1);
  doc.restore();
};

/**
 * A static, always-shown authenticity seal — a dashed ring around a
 * bordered circle with a large "H" — sitting between the signatory and
 * date columns, with a small caption underneath matching the style of
 * the other two column captions. Purely decorative; not a
 * scannable/verifiable mark.
 */
const drawAuthenticitySeal = (doc, cx, cy, radius) => {
  doc.save();
  doc.circle(cx, cy, radius).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.circle(cx, cy, radius - 5).lineWidth(0.75).dash(1.5, { space: 1.5 }).strokeColor(COLORS.lightGray).stroke();
  doc.undash();
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(radius * 0.65).fillColor(COLORS.border);
  doc.text('H', cx - radius, cy - (radius * 0.65) / 2 - 1, { width: radius * 2, align: 'center', lineBreak: false });

  doc.font('Helvetica').fontSize(7).fillColor(COLORS.lightGray).text('SEAL OF AUTHENTICITY', cx - 90, cy + radius + 9, {
    width: 180,
    align: 'center',
    characterSpacing: 0.4,
    lineBreak: false,
  });
};

/** Full-width navy disclaimer strip above the copyright line, with small gold star flourishes at each end. */
const drawDisclaimerBar = (doc, pageWidth, y, text) => {
  const x = 60;
  const barW = pageWidth - 120;
  const barH = 18;

  doc.save();
  doc.fillColor(COLORS.brandDark).rect(x, y, barW, barH).fill();
  doc.restore();

  doc.font('Helvetica-Oblique').fontSize(7.8).fillColor('#ffffff').text(text, x + 34, y + barH / 2 - 4, {
    width: barW - 68,
    align: 'center',
    lineBreak: false,
  });

  drawStar(doc, x + 18, y + barH / 2, 5, COLORS.gold);
  drawStar(doc, x + barW - 18, y + barH / 2, 5, COLORS.gold);
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
 *
 * The three logo slots at the bottom read: "Assessment Partner" (the
 * HireAssess reseller/company running the assessment, `bundle.company`),
 * "Certifying Platform" (HireAssess itself — always the same static
 * shield mark, no bundle data needed), and "Client Organisation" (the
 * end client the assessment was run for, `bundle.assessment.client`).
 *
 * The category row above it (Behavioural / Analytical / Logical by
 * default) is driven by `bundle.certificateCategories` when present —
 * an array of `{ key, label, description, color }` — so a caller can
 * swap in the assessment's real category breakdown; otherwise it falls
 * back to the three generic categories shown here.
 *
 * The authorized signatory is the company's admin user (Company has no
 * "signatory" field of its own in the Prisma schema — the admin is the
 * `User` row with `role.isCompanyAdmin = true` for that company, the same
 * lookup `company.service.js`'s `getDetails()` already does). Pass that
 * user as `bundle.companyAdmin = { firstName, lastName }` when assembling
 * the bundle. `bundle.signatory = { name, signatureUrl, stampUrl }` is
 * still honoured first if present, for the rarer case of signing as a
 * specific person other than the admin. If neither is available, the
 * block prints a blank name line under "AUTHORIZED SIGNATORY" rather
 * than breaking.
 *
 * Every field pulled off `bundle` is read defensively (optional chaining
 * + safeString/fallback) because this bundle is assembled from several
 * independent DB lookups (candidate-answer, exam-attempt, question,
 * assessment-result) and any one of those relations can legitimately be
 * missing or null for a given attempt — that must never crash PDF
 * generation, it should just render "Unknown X" instead.
 *
 * There is deliberately no QR / verification-URL section — this
 * certificate is a printable/shareable artifact only.
 */
const generateCertificatePdf = ({ bundle }) => {
  if (!bundle) {
    throw new Error('generateCertificatePdf: bundle is required');
  }

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
  const candidateName = candidate
    ? safeString(`${candidate.firstName ?? ''} ${candidate.lastName ?? ''}`.trim(), 'Unknown Candidate')
    : 'Unknown Candidate';
  const assessmentName = safeString(bundle.assessment?.name, 'Unknown Assessment');
  const level = bundle.assessment?.level ?? null;
  const companyName = safeString(bundle.company?.name, 'Unknown Company');
  const clientName = safeString(bundle.assessment?.client?.name, 'Unknown Client');
  const overallScore = typeof bundle.overallScore === 'number' && Number.isFinite(bundle.overallScore) ? Math.round(bundle.overallScore) : 0;
  // Defensive against a stored `null` band, not just `undefined` — `??`
  // alone does not catch `null`, which previously let `grade` reach
  // `.toUpperCase()` as `null` and crash mid-generation.
  const grade = safeString(bundle.report?.overall?.band, scoreBand(overallScore));
  const gradeColor = scoreColor(overallScore);
  const submittedAt = bundle.submittedAt ? new Date(bundle.submittedAt) : new Date();
  const issueDateLabel = Number.isNaN(submittedAt.getTime())
    ? new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : submittedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const certificateNumber = buildCertificateNumber({
    candidateId: candidate?.id,
    assessmentId: bundle.assessment?.id,
    submittedAt: bundle.submittedAt,
  });

  const categories = Array.isArray(bundle.certificateCategories) && bundle.certificateCategories.length
    ? bundle.certificateCategories.slice(0, 3)
    : DEFAULT_CATEGORIES;

  const companyLogo = loadLocalImage(bundle.company?.logoUrl);
  const clientLogo = loadLocalImage(bundle.assessment?.client?.logoUrl);

  // Signatory: prefer an explicit `bundle.signatory` (a specific person
  // signing this certificate); fall back to the company admin user.
  const signatoryName = safeString(
    bundle.signatory?.name ??
      (bundle.companyAdmin ? `${bundle.companyAdmin.firstName ?? ''} ${bundle.companyAdmin.lastName ?? ''}`.trim() : null),
    ''
  );
  const signatureImage = loadLocalImage(bundle.signatory?.signatureUrl ?? bundle.company?.signatureUrl);
  const stampImage = loadLocalImage(bundle.signatory?.stampUrl ?? bundle.company?.stampUrl);

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

  /* ---------------------------- score medallion (right column) ---------------------------- */
  /* Drawn before the left content block since it occupies a fixed,      */
  /* independent column on the right and the left block's width is       */
  /* sized to leave room for it.                                         */

  const badgeR = 46;
  const badgeCX = pageWidth - 150;
  const badgeCY = 235;
  drawScoreMedallion(doc, badgeCX, badgeCY, badgeR, overallScore, grade, gradeColor);

  const contentLeft = 60;
  const contentRight = badgeCX - badgeR - 34 - 20; // clears the laurel wreath with a margin
  const contentWidth = contentRight - contentLeft;

  /* ---------------------------- title block ---------------------------- */

  let y = 90;
  doc.font('Times-Bold').fontSize(27).fillColor(COLORS.heading).text('CERTIFICATE', contentLeft, y, {
    width: contentWidth,
    align: 'center',
    characterSpacing: 3,
    lineBreak: false,
  });

  y += 32;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.gold).text('OF ACHIEVEMENT', contentLeft, y, {
    width: contentWidth,
    align: 'center',
    characterSpacing: 3,
    lineBreak: false,
  });
  const subCenterX = contentLeft + contentWidth / 2;
  doc.save();
  doc.lineWidth(1).strokeColor(COLORS.goldLight);
  doc.moveTo(subCenterX - 130, y + 6).lineTo(subCenterX - 78, y + 6).stroke();
  doc.moveTo(subCenterX + 78, y + 6).lineTo(subCenterX + 130, y + 6).stroke();
  doc.restore();

  y += 26;
  drawRibbonBanner(doc, subCenterX, y, 230, 20, 'THIS IS TO CERTIFY THAT', COLORS.accent, '#ffffff', 9);

  y += 20 + 18;
  drawFittedLine(doc, candidateName, contentLeft, y, contentWidth, { font: 'Times-BoldItalic', maxSize: 26, minSize: 15, color: COLORS.neutral, align: 'center' });

  y += 34;
  drawAccentDivider(doc, subCenterX, y, 90);

  /* ---------------------------- body paragraph ---------------------------- */

  y += 16;
  const levelClause = level ? ` (Level ${level})` : '';
  const bodyText =
    `has successfully completed the ${assessmentName}${levelClause} assessment, administered by HireAssess on behalf of ${clientName}, ` +
    `and achieved an overall score of ${overallScore} out of 100 — a performance graded as ${grade}. This certificate is issued in ` +
    `recognition of the skills and aptitude demonstrated in the following areas:`;

  doc.font('Helvetica').fontSize(9.8).fillColor(COLORS.gray).text(bodyText, contentLeft + 6, y, {
    width: contentWidth - 12,
    align: 'center',
    lineGap: 3.5,
  });

  /* ---------------------------- category row ---------------------------- */

  const catIconSize = 32;
  const catY = doc.y + 12;
  const colWidth = contentWidth / categories.length;
  const catTextWidth = colWidth - 16;

  // Measure first (text can wrap to 2+ lines depending on description
  // length), so the row below is placed clear of the tallest column
  // rather than assuming a fixed height and risking overlap.
  const catRowHeight = Math.max(
    ...categories.map((category) => measureCategoryBlockHeight(doc, catIconSize, category, catTextWidth))
  );

  categories.forEach((category, i) => {
    const colCenterX = contentLeft + colWidth * (i + 0.5);
    drawCategoryBadge(doc, colCenterX, catY, catIconSize, category, catTextWidth);
    if (i > 0) {
      doc.save();
      doc.lineWidth(0.75).strokeColor(COLORS.border);
      doc.moveTo(contentLeft + colWidth * i, catY - 4).lineTo(contentLeft + colWidth * i, catY + catRowHeight).stroke();
      doc.restore();
    }
  });

  /* ---------------------------- three-party logo row ---------------------------- */

  const partyY = Math.max(catY + catRowHeight + 16, 320);
  const logoSize = 42;
  const shieldSize = 36;
  const slotSpacing = 200;

  drawEntityBadge(doc, SVGtoPDF, centerX - slotSpacing, partyY, logoSize, companyLogo, companyName, 'Assessment Partner');
  const shieldY = partyY + (logoSize - shieldSize) / 2;
  drawPlatformBadge(doc, centerX, shieldY, shieldSize);
  drawEntityBadge(doc, SVGtoPDF, centerX + slotSpacing, partyY, logoSize, clientLogo, clientName, 'Client Organisation');

  // Bottom-most point actually reached by the row's text (caption +
  // bold name stacked under each logo/badge) — used below to size the
  // authenticity seal so it never collides with this row even when a
  // long company/client name or a wrapped description upstream has
  // pushed the whole row further down the page than usual.
  const partyBottom = Math.max(partyY + logoSize + 30.5, shieldY + shieldSize * 1.15 + 30.5);

  /* ---------------------------- signature row ---------------------------- */

  const sigY = pageHeight - 92;
  const colWidth2 = 210;
  const sigX = 120;
  const dateX = pageWidth - 120 - colWidth2;

  drawSignatoryBlock(doc, SVGtoPDF, sigX, sigY, colWidth2, {
    name: signatoryName,
    image: signatureImage,
  });

  if (stampImage) {
    drawStampOverlay(doc, SVGtoPDF, stampImage, sigX + colWidth2 - 30, sigY - 32, 60);
  }

  const sealRadius = Math.max(15, Math.min(24, (sigY - 8 - partyBottom) / 2));
  drawAuthenticitySeal(doc, centerX, sigY - sealRadius - 4, sealRadius);

  drawSignatureLine(doc, dateX, sigY, colWidth2, 'Date of Issue', issueDateLabel);

  /* ---------------------------- footer ---------------------------- */

  const disclaimerY = pageHeight - 46;
  drawDisclaimerBar(doc, pageWidth, disclaimerY, 'This certificate reflects performance on a single assessment attempt and is not a guarantee of future performance.');

  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.lightGray).text(
    `© ${COMPANY_NAME} All rights reserved.`,
    60,
    pageHeight - 22,
    { width: pageWidth - 120, align: 'center', lineBreak: false }
  );

  return doc;
};

module.exports = { generateCertificatePdf };