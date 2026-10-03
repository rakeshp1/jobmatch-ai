const db = require('../database/db');
const { HttpError } = require('../middleware/httpError');
const { getResume } = require('../models/resumeModel');
const { getJob } = require('../models/jobModel');
const { listAccepted, insertAccepted } = require('../models/acceptedModel');
const { inspect } = require('./matchService');
const { extractSummary, resumeBullets } = require('./textAnalysis');
const { categoryForScore, categoryLabel } = require('./scoring');
const { refreshDerived } = require('./resumeService');

const BULLETS = {
  Kafka: 'Owned Kafka topics and consumer jobs that moved operational events into the lake with replay, lag alerts, and backfill procedures.',
  Terraform: 'Provisioned pipeline infrastructure with Terraform so warehouses, buckets, and orchestration roles stayed reviewable in version control.',
  'Azure Data Factory': 'Built monitored ELT pipelines in Azure Data Factory, with retries and data-quality gates, so curated datasets landed before downstream jobs.',
  'Azure Synapse': 'Modeled serving tables in Azure Synapse and tuned SQL pools for the KPI queries analysts run each morning.',
  'Azure Databricks': 'Developed PySpark transformations on Azure Databricks and promoted notebooks through pull requests into scheduled production jobs.',
  ADLS: 'Landed raw and curated zones in ADLS Gen2 with clear folder contracts, retention, and access for analytics consumers.',
  'Azure DevOps': 'Shipped pipeline changes through Azure DevOps pipelines with build checks, environment approvals, and rollback notes.',
  'Azure SQL': 'Published curated marts to Azure SQL and indexed the access paths used by operational reports.',
  PyTorch: 'Trained and compared PyTorch models against a held-out set, then packaged the winning checkpoint for batch scoring.',
  TensorFlow: 'Served a TensorFlow model behind a versioned endpoint and watched input drift before promoting a new release.',
  Kubernetes: 'Ran scoring and data jobs on Kubernetes with resource limits, health checks, and a documented rollback.',
  'Model Deployment': 'Took a model from notebook to model deployment, including a feature contract, a canary, and a rollback path.',
  MLflow: 'Tracked parameters and metrics in MLflow so model promotion was a reviewable decision rather than a local notebook.',
  'Feature Engineering': 'Built reusable feature engineering steps with training-serving consistency checks and documented definitions.',
  'Feature Store': 'Registered offline and online features in a feature store so training sets and live scoring used the same definitions.',
  'Machine Learning': 'Partnered with stakeholders to frame a machine learning problem, define the label, and report lift against a simple baseline.',
  Statistics: 'Used statistical analysis and hypothesis testing to decide whether a metric move was real before recommending a product change.',
  'A/B Testing': 'Designed A/B testing readouts with guardrail metrics, sample-size notes, and a clear ship-or-hold recommendation.',
  'scikit-learn': 'Trained scikit-learn baselines, compared them with stronger models, and kept the simpler model when the lift was not worth the complexity.',
  Experimentation: 'Ran online experiments end to end, from metric definition through analysis, and wrote the decision memo for partners.',
  'Power BI': 'Published a Power BI model with certified measures so business users stopped rebuilding the same KPI logic.',
  'Model Monitoring': 'Added model monitoring for volume, nulls, and score drift, with an on-call note for when to retrain.',
  NLP: 'Shipped an NLP classification pass with an error review loop and a fallback for low-confidence predictions.',
};

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function bulletFor(skill) {
  return BULLETS[skill] || `Applied ${skill} on a production workload, wrote down the tradeoffs, and measured the change in reliability or delivery time.`;
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
    const improved = summary
      ? `${summary} Recent work to emphasize for this role: ${focus.join(', ')}.`
      : `Hands-on experience to foreground: ${focus.join(', ')}, with ownership from design through production.`;
    const suggestedBullet = `Delivered production outcomes using ${focus.slice(0, 3).join(', ')}, and wrote the results up so partners could trace the impact.`;
    recommendations.push({
      id: 'summary-emphasis',
      title: 'Name the missing themes in your summary',
      currentWording: summary || 'No summary section was detected.',
      improvedWording: improved,
      suggestedBullet,
      missingKeywords: detail.missingKeywords.slice(0, 4),
      skillsToEmphasize: detail.missingSkills.slice(0, 3),
      insertText: `${improved}\n${suggestedBullet}`,
    });
  }

  detail.missingSkills.slice(0, 4).forEach((skill) => {
    const currentWording = closestBullet(resumeText, skill);
    const improvedWording = bulletFor(skill);
    const relatedKeywords = detail.missingKeywords.filter((keyword) => keyword.toLowerCase().includes(skill.toLowerCase().split(' ')[0].toLowerCase())).slice(0, 3);
    recommendations.push({
      id: `skill-${slug(skill)}`,
      title: `Show ${skill} with a concrete outcome`,
      currentWording,
      improvedWording,
      suggestedBullet: improvedWording,
      missingKeywords: relatedKeywords,
      skillsToEmphasize: [skill],
      insertText: improvedWording,
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

function acceptRecommendations(jobId, ids) {
  if (!Array.isArray(ids) || !ids.length) {
    throw new HttpError(400, 'Select at least one recommendation to accept.');
  }
  const uniqueIds = [...new Set(ids.map((id) => String(id)))];
  if (uniqueIds.length > 20) throw new HttpError(400, 'Too many recommendations were submitted.');

  const plan = getPlan(jobId);
  const available = new Map(plan.recommendations.map((item) => [item.id, item]));
  const chosen = uniqueIds.map((id) => {
    const recommendation = available.get(id);
    if (!recommendation) throw new HttpError(400, 'One of those recommendations is no longer available. Refresh and try again.');
    return recommendation;
  });

  const resume = getResume();
  const now = new Date().toISOString();
  const nextText = appendTailoring(resume.working_text, chosen.map((item) => item.insertText));
  const transaction = db.transaction(() => {
    db.prepare('UPDATE resumes SET working_text = ? WHERE id = ?').run(nextText, resume.id);
    chosen.forEach((item) => insertAccepted({ jobId, recommendationId: item.id, wording: item.insertText, createdAt: now }));
  });
  transaction();
  refreshDerived(resume.id);

  return {
    accepted: chosen.map((item) => item.id),
    message: `Accepted ${chosen.length} recommendation${chosen.length === 1 ? '' : 's'}. Re-run match analysis to refresh the score.`,
    plan: getPlan(jobId),
  };
}

module.exports = { getPlan, acceptRecommendations };
