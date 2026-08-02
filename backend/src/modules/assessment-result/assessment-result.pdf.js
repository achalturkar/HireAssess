'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/* ================================================================== */
/*  Brand palette & type scale                                         */
/* ================================================================== */

const COLORS = {
  brandDark: '#0B0F26', // logo mark / wordmark "Hire"
  accent: '#0E7C6B', // wordmark "Assess" + strengths / in-range
  heading: '#0b3b66',
  neutral: '#111827',
  gray: '#6b7280',
  lightGray: '#9CA3AF',
  success: '#10b981', // strengths / in ideal range
  warning: '#f59e0b', // moderate / above ideal range
  danger: '#ef4444', // development areas
  border: '#e2e8f0',
  track: '#eef2f6',
  background: '#f9fafb',
};

const FONT = {
  h1: 20,
  h2: 15.5,
  body: 10.5,
  small: 9,
  tiny: 8,
};

const scoreColor = (score) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

const scoreBand = (score) => {
  if (score >= 75) return 'Strength';
  if (score >= 50) return 'Moderate';
  return 'Development area';
};

const normalizeText = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();

const classifyQuestionType = (qa) => {
  const type = String(qa.question?.type ?? qa.answer?.questionType ?? '').toUpperCase();
  if (type === 'ANALYTICAL') return 'Analytical';
  if (type === 'LOGICAL_REASONING' || type === 'LOGICAL') return 'Logical';
  if (type === 'LIKERT' || type === 'SITUATIONAL_JUDGEMENT' || type === 'FORCED_CHOICE') return 'Behavioural';

  const question = qa.question || {};
  const category = String(question.category ?? '').toLowerCase();
  if (category.includes('analytical')) return 'Analytical';
  if (category.includes('logical')) return 'Logical';
  if (category.includes('behaviour') || category.includes('behavior') || category.includes('situational') || category.includes('judgement')) return 'Behavioural';
  if (category.includes('reasoning')) return 'Behavioural';
  if (question.scenario) return 'Behavioural';
  if (question.options) return 'Behavioural';
  if (question.items) return 'Logical';
  if (question.question) return 'Analytical';
  return 'Other';
};

/* ================================================================== */
/*  Trait interpretation library                                       */
/*                                                                       */
/*  Sourced from the same low/high framing used in psychometric reports */
/*  (e.g. the Schuhfried/Audi Online Assessment format). Keyed by a      */
/*  normalized trait name; falls back to a generic interpretation for    */
/*  any trait not in the dictionary, so this never renders blank.        */
/* ================================================================== */

const TRAIT_DESCRIPTIONS = {
  'logical reasoning': {
    low: 'Could have difficulty rapidly identifying similarities and differences between items of information, and may need more time to learn and categorise new things.',
    high: 'Finds it easy to draw logical conclusions, understand the big picture, and transfer existing knowledge to new problem situations.',
  },
  'numerical reasoning': {
    low: 'Finds it more difficult to understand basic mathematical principles or apply them flexibly to practical problems.',
    high: 'Is good at using basic arithmetical operations and very flexible in dealing with numbers in everyday work.',
  },
  'arithmetical flexibility': {
    low: 'Finds it more difficult to understand basic mathematical principles or apply them flexibly to practical problems.',
    high: 'Is good at using basic arithmetical operations and very flexible in dealing with numbers in everyday work.',
  },
  'verbal comprehension': {
    low: 'May have difficulty identifying relevant information in documents and discussions, and can overlook important detail.',
    high: 'Finds it easy to understand documents and discussions and quickly forms an overall picture of a situation.',
  },
  'text comprehension': {
    low: 'May have difficulty identifying relevant information in documents and discussions, and can overlook important detail.',
    high: 'Finds it easy to understand documents and discussions and quickly forms an overall picture of a situation.',
  },
  equanimity: {
    low: 'Tends to become frustrated or annoyed more readily and may find it difficult to remain calm under pressure.',
    high: 'Describes themselves as even-tempered and harmonious, remaining composed even under great pressure.',
  },
  'social confidence': {
    low: 'Describes themselves as relatively shy and can feel uncomfortable or insecure when dealing with others.',
    high: 'Appears self-confident, informal and relaxed, and is natural and at ease in behaviour towards others.',
  },
  'emotional robustness': {
    low: 'Tends to describe themselves as not very resilient under stress and is easier to unnerve.',
    high: 'Copes with prolonged high stress and performs consistently, keeping a cool head in difficult situations.',
  },
  'stress tolerance': {
    low: 'Tends to describe themselves as not very resilient under stress and is easier to unnerve.',
    high: 'Copes with prolonged high stress and performs consistently, keeping a cool head in difficult situations.',
  },
  friendliness: {
    low: 'Describes themselves as relatively reserved and not particularly outgoing in dealings with others.',
    high: 'Describes themselves as sociable and affectionate, dealing with others in a warm, personal way.',
  },
  sociableness: {
    low: 'Describes themselves as fairly reserved and prefers working alone to actively seeking out others.',
    high: 'Describes themselves as talkative and sociable, constantly seeking contact and preferring group work.',
  },
  sociability: {
    low: 'Describes themselves as fairly reserved and prefers working alone to actively seeking out others.',
    high: 'Describes themselves as talkative and sociable, constantly seeking contact and preferring group work.',
  },
  'openness to feelings': {
    low: 'Tends to describe themselves as not very emotional, attaching more importance to objectivity than feelings.',
    high: 'Describes themselves as sensitive and emotionally aware, empathic to the feelings of others.',
  },
  'openness to actions': {
    low: 'Prefers relatively conventional, routine activities and tends to retain existing processes.',
    high: 'Is keen on experimenting and constantly seeking new experiences, preferring variety to routine.',
  },
  'openness to ideas': {
    low: 'Tends to describe themselves as not very curious, preferring work that avoids constant new learning.',
    high: 'Describes themselves as curious and interested, enjoying learning and open to new ideas.',
  },
  'sense of duty': {
    low: 'Tends to describe themselves as not very dutiful, and can be relatively unreliable in performing duties.',
    high: 'Describes themselves as reliable and responsible, taking responsibilities seriously and keeping their word.',
  },
  ambition: {
    low: 'Tends to describe themselves as not very goal-oriented and less willing to take on additional work.',
    high: 'Describes themselves as committed, goal-oriented and hard-working, with high self-expectations.',
  },
  discipline: {
    low: 'Describes themselves as somewhat inconsistent and relatively quick to abandon goals under obstacles.',
    high: 'Describes themselves as self-disciplined and persistent, pursuing goals with rigor even when it is difficult.',
  },
  genuineness: {
    low: 'States they sometimes behave in a calculating way and may come across as not fully authentic.',
    high: 'Describes themselves as honest, trustworthy and sincere, and finds it difficult to dissemble.',
  },
  helpfulness: {
    low: 'Tends to describe themselves as not very considerate, emphasising the benefit to themselves.',
    high: 'Describes themselves as self-sacrificing and unselfish, helpful with customers and colleagues.',
  },
  obligingness: {
    low: 'Tends to describe themselves as resentful and less forgiving, pursuing their own interests in conflict.',
    high: 'Describes themselves as obliging and conciliatory, needing harmony and forgiving others easily.',
  },
};

const getTraitMeaning = (traitName) => {
  const key = String(traitName ?? '').toLowerCase().trim();
  if (TRAIT_DESCRIPTIONS[key]) return TRAIT_DESCRIPTIONS[key];
  return {
    low: `Scored lower on ${traitName}, worth exploring further to see whether it affects performance in this role.`,
    high: `Scored strongly on ${traitName}, a notable positive signal for this role.`,
  };
};

/* ================================================================== */
/*  Low-level drawing helpers                                          */
/* ================================================================== */

const drawFallbackLogoMark = (doc, x, y, size) => {
  doc.save();
  doc.roundedRect(x, y, size, size, size * 0.28).fill('#12162B');
  const barW = size * 0.16;
  const gap = size * 0.08;
  const baseY = y + size * 0.78;
  const bars = [
    { h: size * 0.28, color: '#22C55E' },
    { h: size * 0.47, color: '#14B8A6' },
    { h: size * 0.6, color: '#3B82F6' },
  ];
  let bx = x + size * 0.2;
  bars.forEach((bar) => {
    doc.roundedRect(bx, baseY - bar.h, barW, bar.h, barW * 0.3).fill(bar.color);
    bx += barW + gap;
  });
  doc.restore();
};

const LOGO_CANDIDATES = ['hireassess-logo.svg', 'hireassess-logo.png'];

const loadLogo = () => {
  for (const filename of LOGO_CANDIDATES) {
    const candidate = path.resolve(__dirname, '../../../../frontend/public', filename);
    if (fs.existsSync(candidate)) {
      if (filename.endsWith('.svg')) {
        try {
          return { type: 'svg', content: fs.readFileSync(candidate, 'utf8') };
        } catch {
          continue;
        }
      }
      return { type: 'png', filePath: candidate };
    }
  }
  return null;
};

const drawStatusPill = (doc, rightX, y, text, color) => {
  doc.font('Helvetica-Bold').fontSize(8);
  const textWidth = doc.widthOfString(text);
  const padX = 7;
  const w = textWidth + padX * 2;
  const h = 14;
  const x = rightX - w;
  doc.save();
  doc.roundedRect(x, y, w, h, h / 2).fillOpacity(0.15).fill(color);
  doc.restore();
  doc.fillColor(color).text(text, x + padX, y + 3.2, { lineBreak: false });
  return w;
};

const drawDot = (doc, x, y, r, color) => {
  doc.save();
  doc.circle(x, y, r).fill(color);
  doc.restore();
};

const drawScoreScaleBar = (doc, x, y, width, score) => {
  const segments = [
    { label: 'Need development', color: COLORS.danger },
    { label: 'Moderate', color: COLORS.warning },
    { label: 'Strength', color: COLORS.success },
  ];
  const barHeight = 14;
  const segmentWidth = width / segments.length;

  segments.forEach((segment, index) => {
    const sx = x + index * segmentWidth;
    doc.save();
    doc.roundedRect(sx, y, segmentWidth, barHeight, 6).fill(segment.color);
    doc.restore();
  });

  doc.roundedRect(x, y, width, barHeight, 6).lineWidth(0.8).strokeColor(COLORS.border).stroke();

  const markerX = x + Math.min(Math.max(score, 0), 100) * width / 100;
  doc.save();
  doc.fillColor(COLORS.brandDark).circle(markerX, y + barHeight / 2, 4.5).fill();
  doc.restore();

  const labelY = y + barHeight + 6;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.danger).text('0-49', x, labelY, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.warning).text('50-74', x + width / 3 - 10, labelY, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.success).text('75-100', x + (width * 2) / 3 - 14, labelY, { lineBreak: false });

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray).text('Need development', x, labelY + 10, { width: segmentWidth, lineBreak: false });
  doc.text('Moderate', x + width / 3, labelY + 10, { width: segmentWidth, lineBreak: false });
  doc.text('Strength', x + (width * 2) / 3, labelY + 10, { width: segmentWidth, lineBreak: false });

  return y + barHeight + 24;
};

/**
 * A single trait row: label + status pill, optional one-line interpretation,
 * then a 0-100 track with an optional shaded "ideal range" band and a
 * coloured marker chip showing the candidate's actual score — the same
 * visual language as the source psychometric report this format is based
 * on. Returns the y coordinate immediately below the row so callers can
 * stack rows without guessing spacing.
 */
const drawScoreBar = (doc, x, y, width, trait, opts = {}) => {
  const { score = 0, idealMin, idealMax, note } = opts;
  const hasBand = idealMin != null && idealMax != null;
  const status = hasBand
    ? score < idealMin
      ? 'below'
      : score > idealMax
      ? 'above'
      : 'in'
    : score >= 75
    ? 'strength'
    : score >= 50
    ? 'moderate'
    : 'development';

  const statusMeta = {
    in: { label: 'In ideal range', color: COLORS.success },
    below: { label: 'Below ideal range', color: COLORS.lightGray },
    above: { label: 'Above ideal range', color: COLORS.warning },
    strength: { label: 'Strength', color: COLORS.success },
    moderate: { label: 'Moderate', color: COLORS.warning },
    development: { label: 'Development area', color: COLORS.danger },
  }[status];

  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.neutral);
  doc.text(trait, x, y, { width: width - 120, lineBreak: false });
  drawStatusPill(doc, x + width, y - 1, statusMeta.label, statusMeta.color);

  let cursorY = y + 15;

  if (note) {
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.gray);
    doc.text(note, x, cursorY, { width, lineGap: 1.5 });
    cursorY = doc.y + 4;
  } else {
    cursorY += 2;
  }

  const barTop = cursorY + 8; // leave headroom for the marker chip above the bar
  const barHeight = 12;

  doc.roundedRect(x, barTop, width, barHeight, 4).fill(COLORS.track);

  if (hasBand) {
    const bandX = x + (width * Math.max(0, idealMin)) / 100;
    const bandW = (width * (Math.min(100, idealMax) - Math.max(0, idealMin))) / 100;
    doc.save();
    doc.roundedRect(bandX, barTop, Math.max(1, bandW), barHeight, 3).fillOpacity(0.32).fill(COLORS.success);
    doc.restore();
  } else {
    const fillW = Math.max(8, (width * Math.min(score, 100)) / 100);
    doc.save();
    doc.roundedRect(x, barTop, fillW, barHeight, 4).fillOpacity(0.9).fill(statusMeta.color);
    doc.restore();
  }

  doc.roundedRect(x, barTop, width, barHeight, 4).lineWidth(0.6).strokeColor(COLORS.border).stroke();

  const markerX = x + (width * Math.min(Math.max(score, 0), 100)) / 100;
  doc.save();
  doc.fillColor(statusMeta.color);
  doc.polygon([markerX - 4, barTop - 5], [markerX + 4, barTop - 5], [markerX, barTop + 1]).fill();
  doc.restore();

  const chipText = `${Math.round(score)}`;
  doc.font('Helvetica-Bold').fontSize(8.5);
  const chipW = doc.widthOfString(chipText) + 9;
  const chipX = Math.min(Math.max(markerX - chipW / 2, x), x + width - chipW);
  doc.save();
  doc.roundedRect(chipX, barTop - 20, chipW, 13, 3.5).fill(statusMeta.color);
  doc.restore();
  doc.fillColor('#ffffff').text(chipText, chipX, barTop - 17.5, { width: chipW, align: 'center', lineBreak: false });

  doc.font('Helvetica').fontSize(7).fillColor(COLORS.lightGray);
  doc.text('Low', x, barTop + barHeight + 3, { lineBreak: false });
  doc.text('High', x + width - 24, barTop + barHeight + 3, { width: 24, align: 'right', lineBreak: false });

  return barTop + barHeight + 16;
};

const drawPieChart = (doc, centerX, centerY, radius, segments) => {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  let startAngle = -Math.PI / 2;
  segments.forEach((segment) => {
    if (segment.value <= 0) return;
    const angle = (segment.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    doc
      .moveTo(centerX, centerY)
      .fillColor(segment.color)
      .lineTo(centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle));
    doc.arc(centerX, centerY, radius, startAngle, endAngle).lineTo(centerX, centerY).fill();
    startAngle = endAngle;
  });
  doc.circle(centerX, centerY, radius * 0.42).fill('#ffffff');
};

/** Rounded, coloured list item used for strengths / development areas. */
const drawTraitPillRow = (doc, x, y, width, trait, score, color, description) => {
  const rowH = description ? 40 : 22;
  doc.save();
  doc.roundedRect(x, y, width, rowH, 6).fillOpacity(0.07).fill(color);
  doc.restore();
  drawDot(doc, x + 12, y + 11, 3.5, color);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.neutral);
  doc.text(trait, x + 22, y + 6, { width: width - 70, lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(color);
  doc.text(`${Math.round(score)}/100`, x + width - 55, y + 6, { width: 45, align: 'right', lineBreak: false });
  if (description) {
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.gray);
    doc.text(description, x + 22, y + 20, { width: width - 34, lineGap: 1 });
  }
  return y + rowH + 8;
};

/* ================================================================== */
/*  Report generation                                                   */
/* ================================================================== */

const buildPerformanceSummary = (bundle) => {
  if (bundle.report?.overall?.summary) return bundle.report.overall.summary;
  if (bundle.overallScore >= 80) {
    return 'The candidate demonstrates a strong overall profile with reliable performance across the assessed areas. Maintain current strengths while tracking smaller development opportunities.';
  }
  if (bundle.overallScore >= 60) {
    return 'The candidate shows solid capability with a few focused areas for growth. Improve targeted competencies to increase confidence for the role.';
  }
  return 'The candidate requires further development in multiple assessment areas. Use the trait scores and suggested actions to guide a structured improvement plan.';
};

const PAGE_MARGINS = { top: 50, bottom: 60, left: 50, right: 50 };
const PAGE_WIDTH = 595.28; // A4 in points

const generateResultPdf = ({ bundle }) => {
  let SVGtoPDF = null;
  try {
    SVGtoPDF = require('svg-to-pdfkit');
  } catch {
    SVGtoPDF = null;
  }

  const doc = new PDFDocument({ size: 'A4', margins: PAGE_MARGINS, autoFirstPage: false });
  const contentWidth = PAGE_WIDTH - PAGE_MARGINS.left - PAGE_MARGINS.right;
  const LEFT = PAGE_MARGINS.left;

  const candidate = bundle.candidate;
  const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate';
  const candidateInitials = candidate
    ? `${candidate.firstName?.[0] ?? ''}${candidate.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';
  const assessmentName = bundle.assessment?.name ?? 'Unknown Assessment';
  const level = bundle.assessment?.level ?? 'N/A';
  const clientName = bundle.assessment?.client?.name ?? 'Unknown Client';
  const duration = bundle.assessment?.durationMinutes ? `${bundle.assessment.durationMinutes} min` : 'N/A';
  const submittedAt = bundle.submittedAt ? new Date(bundle.submittedAt).toLocaleString() : 'N/A';
  const startedAt = bundle.startedAt ? new Date(bundle.startedAt) : null;
  const submittedDate = bundle.submittedAt ? new Date(bundle.submittedAt) : null;
  const examTime = startedAt && submittedDate ? `${Math.round((submittedDate - startedAt) / 60000)} min` : 'N/A';
  const reportDate = new Date().toLocaleDateString();
  const summaryText = buildPerformanceSummary(bundle);
  const questionList = Array.isArray(bundle.questions) ? bundle.questions : [];
  const overallScore = typeof bundle.overallScore === 'number' ? bundle.overallScore : 0;

  const counts = { Analytical: 0, Logical: 0, Behavioural: 0, Other: 0 };
  questionList.forEach((qa) => {
    const type = classifyQuestionType(qa);
    counts[type] = (counts[type] || 0) + 1;
  });
  const countTotal = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  const pieSegments = [
    { label: 'Analytical', value: counts.Analytical, color: '#2563eb' },
    { label: 'Logical', value: counts.Logical, color: '#14b8a6' },
    { label: 'Behavioural', value: counts.Behavioural, color: '#f59e0b' },
    { label: 'Other', value: counts.Other, color: '#9ca3af' },
  ];

  const sortedTraits = (bundle.report?.traits || []).slice().sort((a, b) => b.score - a.score);
  const traitEntries = sortedTraits.map((trait) => ({
    trait: trait.trait,
    score: typeof trait.score === 'number' ? trait.score : 0,
    idealMin: typeof trait.idealMin === 'number' ? trait.idealMin : undefined,
    idealMax: typeof trait.idealMax === 'number' ? trait.idealMax : undefined,
  }));
  const strengths = traitEntries.filter((t) => t.score >= 75).slice(0, 5);
  const weaknesses = traitEntries
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, Math.min(3, traitEntries.length));
  const grade = bundle.report?.overall?.band ?? scoreBand(overallScore).replace(' area', '');
  const gradeColor = scoreColor(overallScore);
  const gradeDescription =
    grade === 'High'
      ? 'Excellent performance with strong aptitude across key competencies.'
      : grade === 'Moderate'
      ? 'Solid performance with opportunities for focused improvement.'
      : 'Additional development is recommended to reach the expected competency level.';

  /* ---------------------------- header / footer ---------------------------- */

  const HEADER_TOP = 26;
  const LOGO_SIZE = 30;

  const drawHeader = () => {
    const left = doc.page.margins.left;
    const logo = loadLogo();
    let drew = false;
    if (logo?.type === 'svg' && SVGtoPDF) {
      try {
        SVGtoPDF(doc, logo.content, left, HEADER_TOP, { width: LOGO_SIZE, height: LOGO_SIZE, assumePt: true });
        drew = true;
      } catch {
        drew = false;
      }
    } else if (logo?.type === 'png') {
      try {
        doc.image(logo.filePath, left, HEADER_TOP, { width: LOGO_SIZE, height: LOGO_SIZE });
        drew = true;
      } catch {
        drew = false;
      }
    }
    if (!drew) drawFallbackLogoMark(doc, left, HEADER_TOP, LOGO_SIZE);

    const textX = left + LOGO_SIZE + 10;
    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.brandDark).text('Hire', textX, HEADER_TOP + 1, { continued: true, lineBreak: false });
    doc.fillColor(COLORS.accent).text('Assess', { continued: false, lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray).text('Candidate Assessment Report', textX, HEADER_TOP + 18, { lineBreak: false });

    const dividerY = HEADER_TOP + LOGO_SIZE + 12;
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .moveTo(left, dividerY)
      .lineTo(doc.page.width - doc.page.margins.right, dividerY)
      .stroke();

    doc.x = left;
    doc.y = dividerY + 16;
  };

  const pageHeader = (title, subtitle) => {
    doc.fillColor(COLORS.heading).font('Helvetica-Bold').fontSize(FONT.h1).text(title, LEFT, doc.y, { width: contentWidth, lineGap: 2 });
    if (subtitle) {
      doc.moveDown(0.15);
      doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.gray).text(subtitle, LEFT, doc.y, { width: contentWidth, lineGap: 3 });
    }
    doc.moveDown(0.7);
    doc.x = LEFT;
  };

  const drawFooter = () => {
    const footerY = doc.page.height - doc.page.margins.bottom - 26;
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .moveTo(doc.page.margins.left, footerY)
      .lineTo(doc.page.width - doc.page.margins.right, footerY)
      .stroke();
    doc
      .fontSize(FONT.tiny)
      .fillColor(COLORS.lightGray)
      .text(`Candidate: ${candidateName}  ·  Client: ${clientName}`, doc.page.margins.left, footerY + 7, { width: contentWidth / 2 });
    doc.text(`Report date: ${reportDate}`, doc.page.margins.left + contentWidth / 2, footerY + 7, { width: contentWidth / 2, align: 'right' });
  };

  const addPage = (title, subtitle, contentFn) => {
    doc.addPage();
    drawHeader();
    pageHeader(title, subtitle);
    contentFn();
    drawFooter();
  };

  /** Breaks to a fresh (headered) page if `needed` px won't fit before the footer. */
  const ensureSpace = (needed, continuation) => {
    const bottom = doc.page.height - doc.page.margins.bottom - 40;
    if (doc.y + needed > bottom) {
      drawFooter();
      doc.addPage();
      drawHeader();
      pageHeader(continuation.title, continuation.subtitle);
    }
  };

  /* ---------------------------------- pages ---------------------------------- */

  addPage('Candidate & assessment summary', 'Candidate, client and exam metadata with timing details.', () => {
    const avatarX = doc.page.width - doc.page.margins.right - 46;
    const avatarY = doc.y;
    doc.save();
    doc.circle(avatarX + 23, avatarY + 23, 23).fill(COLORS.brandDark);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text(candidateInitials, avatarX, avatarY + 14, { width: 46, align: 'center', lineBreak: false });

    doc.font('Helvetica-Bold').fontSize(19).fillColor(COLORS.neutral).text(candidateName, LEFT, avatarY, { width: contentWidth - 60 });
    doc.font('Helvetica').fontSize(10.5).fillColor(COLORS.gray).text(`Assessed for ${assessmentName} · Level ${level}`, LEFT, doc.y, { width: contentWidth - 60 });
    doc.moveDown(1.4);
    doc.x = LEFT;

    const fieldRows = [
      [{ label: 'Client', value: clientName }, { label: 'Duration', value: duration }],
      [{ label: 'Submitted at', value: submittedAt }, { label: 'Time taken to solve', value: examTime }],
    ];
    const colWidth = contentWidth / 2;
    let y = doc.y;
    fieldRows.forEach((pair) => {
      pair.forEach((f, ci) => {
        const x = doc.page.margins.left + ci * colWidth;
        doc.font('Helvetica').fontSize(FONT.tiny).fillColor(COLORS.lightGray).text(f.label.toUpperCase(), x, y, { characterSpacing: 0.3, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.neutral).text(f.value, x, y + 11, { width: colWidth - 20 });
      });
      y += 36;
    });
    doc.y = y + 4;

    doc.moveDown(0.6);
    doc.save();
    doc.roundedRect(LEFT, doc.y, contentWidth, 44, 8).fillOpacity(0.08).fill(gradeColor);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(gradeColor).text(`Overall grade: ${grade}`, LEFT + 14, doc.y + 8);
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray).text(`Score ${overallScore}/100`, LEFT + 14, doc.y + 2, { width: contentWidth - 28 });
    doc.y += 26;
    doc.x = LEFT;

    doc.moveDown(1.4);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.neutral).text('Assessment overview', LEFT, doc.y);
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fillColor(COLORS.gray)
      .fontSize(FONT.body)
      .text(
        'This assessment is designed to evaluate candidate strengths across reasoning, decision-making, logical structuring, and behavioural judgement. The following pages present a clear breakdown of performance, trait-level scoring against the ideal profile where available, and guidance for a structured interview.',
        LEFT,
        doc.y,
        { width: contentWidth, lineGap: 5 }
      );
  });

  addPage('Assessment question breakdown', 'Analytical, logical, and behavioural item counts with visual charting.', () => {
    const centerX = LEFT + 90;
    const centerY = doc.y + 80;
    drawPieChart(doc, centerX, centerY, 62, pieSegments);
    let legendY = centerY - 30;
    pieSegments.forEach((segment) => {
      drawDot(doc, centerX + 120, legendY, 4, segment.color);
      const pct = ((segment.value / countTotal) * 100).toFixed(0);
      doc.fillColor(COLORS.neutral).fontSize(9.5).font('Helvetica-Bold').text(`${segment.label}`, centerX + 132, legendY - 4, { continued: true, lineBreak: false });
      doc.font('Helvetica').fillColor(COLORS.gray).text(`  ${segment.value} questions · ${pct}%`, { lineBreak: false });
      legendY += 20;
    });
    // The legend above draws at absolute x coordinates — the cursor must be
    // explicitly returned to the left margin before flowing text resumes,
    // otherwise the paragraph below inherits the legend's x position and
    // wraps into an unreadable single-word column off the right edge of
    // the page.
    doc.x = LEFT;
    doc.y = centerY + 76;

    doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.gray).text(
      `This assessment contains ${countTotal} questions across analytical, logical, and behavioural constructs. Each category is measured to evaluate a distinct part of the candidate's working style:`,
      LEFT,
      doc.y,
      { width: contentWidth, lineGap: 5 }
    );
    doc.moveDown(0.5);
    pieSegments.forEach((segment) => {
      if (segment.value <= 0) return;
      const pct = ((segment.value / countTotal) * 100).toFixed(0);
      const rowY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.neutral).text(segment.label, LEFT, rowY, { lineBreak: false });
      const labelWidth = doc.widthOfString(segment.label);
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.gray).text(
        ` (${segment.value} questions, ${pct}%) — measured to evaluate ${segment.label.toLowerCase()} ability.`,
        LEFT + labelWidth,
        rowY,
        { width: contentWidth - labelWidth, lineGap: 3 }
      );
      doc.x = LEFT;
      doc.y = Math.max(doc.y, rowY + 13);
      doc.moveDown(0.25);
    });
  });

  addPage('Overall result and grade', 'Score summary, performance grade, and result narrative.', () => {
    const scoreCX = doc.page.margins.left + 65;
    const scoreCY = doc.y + 65;
    doc.save();
    doc.circle(scoreCX, scoreCY, 62).fillOpacity(0.09).fill(gradeColor);
    doc.restore();
    doc.circle(scoreCX, scoreCY, 62).lineWidth(2.5).strokeColor(gradeColor).stroke();
    doc.font('Helvetica-Bold').fontSize(26).fillColor(gradeColor).text(`${overallScore}`, scoreCX - 62, scoreCY - 22, { width: 124, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.gray).text('out of 100', scoreCX - 62, scoreCY + 6, { width: 124, align: 'center', lineBreak: false });

    const infoX = scoreCX + 90;
    const infoW = contentWidth - 155;
    drawStatusPill(doc, infoX + 90, scoreCY - 44, grade, gradeColor);
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray).text('Recommendation band', infoX, scoreCY - 44, { width: 90, lineBreak: false });
    doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.gray).text(gradeDescription, infoX, scoreCY - 24, { width: infoW, lineGap: 3 });

    doc.y = scoreCY + 90;
    doc.x = LEFT;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.neutral).text('Performance summary', LEFT, doc.y);
    doc.moveDown(0.4);
    doc.y = drawScoreScaleBar(doc, LEFT, doc.y, contentWidth, overallScore);
    doc.moveDown(0.3);
    doc.fontSize(FONT.body).fillColor(COLORS.gray).font('Helvetica').text(summaryText, LEFT, doc.y, { width: contentWidth, lineGap: 5 });
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor(COLORS.neutral).font('Helvetica-Bold').text('Performance notes', LEFT, doc.y);
    doc.moveDown(0.3);
    doc.font('Helvetica').fillColor(COLORS.gray).fontSize(FONT.body).text(`•  ${gradeDescription}`, LEFT, doc.y, { width: contentWidth, lineGap: 5 });
    doc.font('Helvetica').fillColor(COLORS.gray).fontSize(FONT.body).text('•  See the trait score page for a granular, colour-coded view of strengths and development areas.', LEFT, doc.y, { width: contentWidth, lineGap: 5 });
  });

  addPage('Trait scores on 100-point scale', 'Each trait plotted against the ideal profile, where available, with a short interpretation.', () => {
    if (traitEntries.length === 0) {
      doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.gray).text('No trait-level scores were recorded for this attempt.');
      return;
    }
    traitEntries.forEach((entry) => {
      ensureSpace(76, { title: 'Trait scores on 100-point scale (continued)', subtitle: 'Each trait plotted against the ideal profile, where available.' });
      const meaning = getTraitMeaning(entry.trait);
      const note = entry.score >= 60 ? meaning.high : meaning.low;
      const nextY = drawScoreBar(doc, LEFT, doc.y, contentWidth, entry.trait, {
        score: entry.score,
        idealMin: entry.idealMin,
        idealMax: entry.idealMax,
        note,
      });
      doc.y = nextY;
      doc.x = LEFT;
    });
    doc.moveDown(0.6);
    doc.x = LEFT;
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.neutral).text('How to read these scores', LEFT, doc.y);
    doc.moveDown(0.2);
    doc
      .font('Helvetica')
      .fontSize(FONT.small)
      .fillColor(COLORS.gray)
      .text(
        'Traits are shown on a 0–100 axis. Where an ideal range for the role is available it is shaded green — the closer the marker sits inside that band, the stronger the fit. Otherwise, scores of 75+ are treated as a strength, 50–74 as moderate, and below 50 as a development area.',
        LEFT,
        doc.y,
        { width: contentWidth, lineGap: 4 }
      );
  });

  addPage('Strengths and development areas', 'Colour-coded breakdown with suggested actions for the weakest traits.', () => {
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.success).text('Top strengths', LEFT, doc.y);
    doc.moveDown(0.4);
    if (strengths.length === 0) {
      doc.font('Helvetica').fontSize(FONT.small).fillColor(COLORS.gray).text('No traits reached the strength threshold (75+) on this attempt.', LEFT, doc.y, { width: contentWidth });
    } else {
      strengths.forEach((entry) => {
        ensureSpace(30, { title: 'Strengths and development areas (continued)', subtitle: 'Colour-coded breakdown with suggested actions.' });
        doc.y = drawTraitPillRow(doc, LEFT, doc.y, contentWidth, entry.trait, entry.score, COLORS.success);
      });
    }
    doc.x = LEFT;

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.danger).text('Primary improvement areas', LEFT, doc.y, { width: contentWidth });
    doc.moveDown(0.4);
    weaknesses.forEach((entry) => {
      const meaning = getTraitMeaning(entry.trait);
      ensureSpace(48, { title: 'Strengths and development areas (continued)', subtitle: 'Colour-coded breakdown with suggested actions.' });
      doc.y = drawTraitPillRow(doc, LEFT, doc.y, contentWidth, entry.trait, entry.score, COLORS.danger, meaning.low);
    });
    doc.x = LEFT;

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.neutral).text('Suggested actions', LEFT, doc.y, { width: contentWidth });
    doc.moveDown(0.2);
    weaknesses.forEach((entry) => {
      ensureSpace(20, { title: 'Strengths and development areas (continued)', subtitle: 'Colour-coded breakdown with suggested actions.' });
      doc.font('Helvetica').fontSize(FONT.small).fillColor(COLORS.gray).text(`•  Develop ${entry.trait} through targeted coaching, practice scenarios, and feedback loops.`, LEFT, doc.y, { width: contentWidth, lineGap: 4 });
    });
  });

  addPage('Interview questions', 'Suggested prompts to explore each development area in more depth.', () => {
    doc
      .font('Helvetica')
      .fontSize(FONT.body)
      .fillColor(COLORS.gray)
      .text('It is recommended that the areas below are explored further in a post-test interview.', LEFT, doc.y, { width: contentWidth, lineGap: 4 });
    doc.moveDown(0.6);

    if (weaknesses.length === 0) {
      doc.font('Helvetica').fontSize(FONT.small).fillColor(COLORS.gray).text('No development areas were identified for this attempt.', LEFT, doc.y, { width: contentWidth });
    }

    weaknesses.forEach((entry) => {
      const meaning = getTraitMeaning(entry.trait);
      ensureSpace(110, { title: 'Interview questions (continued)', subtitle: 'Suggested prompts to explore each development area in more depth.' });

      doc.save();
      doc.roundedRect(LEFT, doc.y, contentWidth, 2, 1).fill(COLORS.danger);
      doc.restore();
      doc.y += 8;

      // Trait name + score on one row, both drawn at explicit coordinates
      // rather than chained with {continued:true} — continued text with no
      // width inherits whatever the cursor's x happens to be, which is what
      // caused the cut-off "Tell me about a time..." lines.
      const rowY = doc.y;
      doc.font('Helvetica-Bold').fontSize(11.5).fillColor(COLORS.neutral).text(entry.trait, LEFT, rowY, { lineBreak: false });
      const traitWidth = doc.widthOfString(entry.trait);
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray).text(`   (score ${Math.round(entry.score)}/100)`, LEFT + traitWidth, rowY + 1.5, { lineBreak: false });
      doc.x = LEFT;
      doc.y = rowY + 16;

      doc.font('Helvetica').fontSize(FONT.small).fillColor(COLORS.gray).text(meaning.low, LEFT, doc.y, { width: contentWidth, lineGap: 3 });
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(FONT.small).fillColor(COLORS.neutral).text('Ask:', LEFT, doc.y);
      [
        `Tell me about a time your ${entry.trait.toLowerCase()} was tested at work. What happened, and what would you do differently?`,
        `How do you currently compensate for or manage ${entry.trait.toLowerCase()} in a fast-paced role?`,
      ].forEach((q) => {
        doc.font('Helvetica').fontSize(FONT.small).fillColor(COLORS.gray).text(`•  ${q}`, LEFT, doc.y, { width: contentWidth, lineGap: 3 });
      });
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(FONT.tiny).fillColor(COLORS.lightGray).text('Notes: _______________________________________________', LEFT, doc.y, { width: contentWidth });
      doc.moveDown(0.7);
      doc.x = LEFT;
    });
  });

  addPage('Development guidance', 'Actionable guidance for the candidate based on assessment insights.', () => {
    const guidance = [
      'Use this report to create a personal development plan for the candidate, prioritizing the weakest traits first.',
      'Revisit the trait score chart after training cycles to verify progress and adjust coaching focus.',
      'Pair strengths with real-world responsibilities to keep those skills active while weaker areas are improved.',
    ];
    guidance.forEach((item) => {
      doc.fontSize(FONT.body).fillColor(COLORS.gray).font('Helvetica').text(`•  ${item}`, LEFT, doc.y, { width: contentWidth, lineGap: 6 });
      doc.moveDown(0.35);
    });
    doc.moveDown(0.5);
    if (weaknesses.length) {
      doc.fontSize(11).fillColor(COLORS.neutral).font('Helvetica-Bold').text('Suggested improvement cycle', LEFT, doc.y);
      doc.moveDown(0.3);
      weaknesses.forEach((entry) => {
        ensureSpace(20, { title: 'Development guidance (continued)', subtitle: 'Actionable guidance for the candidate based on assessment insights.' });
        doc.font('Helvetica').fillColor(COLORS.gray).fontSize(FONT.body).text(`•  Target ${entry.trait} with practice cases, mentorship, and review sessions.`, LEFT, doc.y, { width: contentWidth, lineGap: 6 });
      });
    }
  });

  addPage('Thank you', 'Report completion and description.', () => {
    doc
      .fontSize(FONT.body)
      .font('Helvetica')
      .fillColor(COLORS.gray)
      .text('Thank you for reviewing this assessment report. It is intended to support transparent, data-driven hiring decisions while guiding candidate development.', LEFT, doc.y, { width: contentWidth, lineGap: 6 });
    doc.moveDown(0.8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.neutral).text('Report description', LEFT, doc.y);
    doc.moveDown(0.3);
    doc
      .fontSize(FONT.body)
      .fillColor(COLORS.gray)
      .font('Helvetica')
      .text('This report is optimised for print or PDF distribution, with a colour-coded breakdown of performance, trait-level scores, improvement guidance, and brand-aligned header and footer details.', LEFT, doc.y, { width: contentWidth, lineGap: 6 });
    doc.moveDown(0.8);
    doc
      .fontSize(FONT.body)
      .fillColor(COLORS.gray)
      .font('Helvetica')
      .text('To request a tailored version of this report or a deeper competency analysis, please contact your HireAssess administrator.', LEFT, doc.y, { width: contentWidth, lineGap: 6 });
  });

  return doc;
};

module.exports = { generateResultPdf };