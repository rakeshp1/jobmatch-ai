const db = require('../database/db');
const { HttpError } = require('../middleware/httpError');
const { getResume } = require('../models/resumeModel');
const { getJob } = require('../models/jobModel');
const { listAccepted, insertAccepted } = require('../models/acceptedModel');
const { inspect } = require('./matchService');
const { extractSummary, resumeBullets } = require('./textAnalysis');
const { categoryForScore, categoryLabel } = require('./scoring');
const { refreshDerived } = require('./resumeService');

const UNFILLED = /\[\[|describe the real workload|a result you can support|name only tools you have used/i;
const MAX_WORKING_CHARS = 80000;

function draftForSkill(skill) {
  return `Used ${skill} to [[describe the real workload]]. Outcome: [[a result you can support]].`;
}

function wordingProblem(text) {
  const wording = String(text || '').trim();
  if (wording.length < 25 || wording.length > 500) {
    return 'Each accepted line must be 25 to 500 characters and describe experience you can support.';
  }
  if (UNFILLED.test(wording)) {
    return 'Replace the draft placeholders with experience you can support, or skip that suggestion.';
  }
  return '';
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function closestBullet(resumeText, skill) {
  const bullets = resumeBullets(resumeText);
  if (!bullets.length) return extractSummary(resumeText) || 'No close bullet was detected in the current resume.';
  const tokens = skill.toLowerCase().split(/[^a-z0-9+]+/).filter((token) => token.length > 2);
  let best = bullets[0];
  let bestScore = -1;
  bullets.forEach((bullet) => {
    const hay = bullet.toLowerCase();
    const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 2 : 0), 0) + Math.min(bullet.length, 180) / 180;
    if (score > bestScore) {
      best = bullet;
      bestScore = score;
    }
  });
  return best;
}

function excerptsFor(resumeText, missingSkills) {
  const excerpts = [];
  const summary = extractSummary(resumeText);
  if (summary) excerpts.push({ id: 'summary', label: 'Summary', text: summary });
  const seen = new Set();
  missingSkills.slice(0, 3).forEach((skill) => {
    const text = closestBullet(resumeText, skill);
    if (!text || seen.has(text)) return;
    seen.add(text);
    excerpts.push({ id: `excerpt-${slug(skill)}`, label: 'Current resume wording', text });
  });
  if (!excerpts.length) {
    excerpts.push({
      id: 'resume',
      label: 'Current resume wording',
      text: resumeText.slice(0, 400),
    });
  }
  return excerpts.slice(0, 4);
}

function buildRecommendations(resumeText, detail) {
  const recommendations = [];
  const summary = extractSummary(resumeText);
  const focus = [...detail.missingSkills.slice(0, 3), ...detail.missingKeywords.slice(0, 2)];

  if (focus.length) {
    const guidance = `Missing from the resume: ${focus.join(', ')}. Add a line only for themes you have actually used. Do not invent a project, metric, or tool.`;
    const draft = '[[Name only tools you have used]] and the outcome [[a result you can support]].';
    recommendations.push({
      id: 'summary-emphasis',
      title: 'Mention a missing theme only if you have done the work',
      currentWording: summary || 'No summary section was detected.',
      guidance,
      improvedWording: guidance,
      suggestedBullet: draft,
      draft,
      missingKeywords: detail.missingKeywords.slice(0, 4),
      skillsToEmphasize: detail.missingSkills.slice(0, 3),
    });
  }

  detail.missingSkills.slice(0, 4).forEach((skill) => {
    const guidance = `If you have used ${skill}, describe the workload and a real outcome in your own words. Skip this if you have not used ${skill}.`;
    const draft = draftForSkill(skill);
    const relatedKeywords = detail.missingKeywords.filter((keyword) => keyword.toLowerCase().includes(skill.toLowerCase().split(' ')[0].toLowerCase())).slice(0, 3);
    recommendations.push({
      id: `skill-${slug(skill)}`,
      title: `Add ${skill} only if you have used it`,
      currentWording: closestBullet(resumeText, skill),
      guidance,
      improvedWording: guidance,
      suggestedBullet: draft,
      draft,
      missingKeywords: relatedKeywords,
      skillsToEmphasize: [skill],
    });
  });

  return recommendations.slice(0, 5);
}

function appendTailoring(workingText, blocks) {
  const cleaned = blocks.map((block) => block.trim()).filter(Boolean);
  if (!cleaned.length) return workingText;
  const bullets = cleaned.map((block) => block.split('\n').map((line) => `- ${line.replace(/^[-•*]\s*/, '').trim()}`).join('\n')).join('\n');
  if (/^Tailored additions\s*$/m.test(workingText)) {
    return `${workingText.trim()}\n${bullets}\n`;
  }
  return `${workingText.trim()}\n\nTailored additions\n${bullets}\n`;
}

function getPlan(jobId) {
  const resume = getResume();
  if (!resume) throw new HttpError(400, 'Upload a resume before improving a match.');
  const job = getJob(jobId);
  if (!job) throw new HttpError(404, 'Job not found.');
  if (job.match_score === null || job.match_score === undefined) {
    throw new HttpError(400, 'Run match analysis before opening Improve Match.');
  }

  const detail = inspect(resume.working_text, job);
  const acceptedRows = listAccepted(jobId);
  const acceptedIds = new Set(acceptedRows.map((row) => row.recommendation_id));
  const recommendations = buildRecommendations(resume.working_text, detail).filter((item) => !acceptedIds.has(item.id));
  const category = categoryForScore(job.match_score);
  const scoreStale = acceptedRows.some((row) => row.created_at > job.updated_at);

  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    matchScore: job.match_score,
    category,
    categoryLabel: categoryLabel(category),
    status: job.status,
    scoreStale,
    explanation: (() => {
      try {
        return JSON.parse(job.analysis_json || '{}').explanation || detail.explanation;
      } catch {
        return detail.explanation;
      }
    })(),
    missingKeywords: detail.missingKeywords,
    skillsToEmphasize: detail.missingSkills.slice(0, 8),
    excerpts: excerptsFor(resume.working_text, detail.missingSkills),
    recommendations,
    accepted: acceptedRows.map((row) => ({
      id: row.recommendation_id,
      wording: row.improved_wording,
      acceptedAt: row.created_at,
    })),
  };
}

function readAcceptance(body) {
  const source = body && typeof body === 'object' ? body : {};
  if (Array.isArray(source.recommendationIds)) {
    throw new HttpError(400, 'Edit each draft before accepting. Placeholder wording is not added to the resume.');
  }
  if (!Array.isArray(source.recommendations)) return [];
  return source.recommendations.map((item) => ({
    id: String(item?.id || '').trim(),
    wording: String(item?.wording || '').trim(),
  }));
}

function acceptRecommendations(jobId, body) {
  const items = readAcceptance(body);
  if (!items.length) throw new HttpError(400, 'Select at least one recommendation and replace the draft with wording you can support.');
  if (items.length > 5) throw new HttpError(400, 'Too many recommendations were submitted.');
  const uniqueIds = new Set(items.map((item) => item.id));
  if (uniqueIds.size !== items.length) throw new HttpError(400, 'Each recommendation can be accepted once.');

  const plan = getPlan(jobId);
  const available = new Map(plan.recommendations.map((item) => [item.id, item]));
  const chosen = items.map((item) => {
    const recommendation = available.get(item.id);
    if (!recommendation) throw new HttpError(400, 'One of those recommendations is no longer available. Refresh and try again.');
    const problem = wordingProblem(item.wording);
    if (problem) throw new HttpError(400, problem);
    return { ...recommendation, wording: item.wording };
  });

  const resume = getResume();
  const now = new Date().toISOString();
  const nextText = appendTailoring(resume.working_text, chosen.map((item) => item.wording));
  if (nextText.length > MAX_WORKING_CHARS) {
    throw new HttpError(400, 'The working resume is too long to add more wording.');
  }
  const transaction = db.transaction(() => {
    db.prepare('UPDATE resumes SET working_text = ? WHERE id = ?').run(nextText, resume.id);
    chosen.forEach((item) => insertAccepted({
      jobId,
      recommendationId: item.id,
      wording: item.wording,
      createdAt: now,
    }));
  });
  try {
    transaction();
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new HttpError(409, 'One of those recommendations was already accepted. Refresh and try again.');
    }
    throw error;
  }
  refreshDerived(resume.id);

  return {
    accepted: chosen.map((item) => item.id),
    message: `Saved ${chosen.length} line${chosen.length === 1 ? '' : 's'} you wrote. Re-run match analysis to refresh the estimate. JobMatch does not check that the lines are true, and the score does not predict an interview or an offer.`,
    plan: getPlan(jobId),
  };
}

module.exports = { getPlan, acceptRecommendations };
