const { HttpError } = require('../middleware/httpError');
const {
  listJobs,
  getJob,
  findByTitleCompany,
  insertJob,
  updateJobRecord,
  updateAnalysis,
  deleteJob,
} = require('../models/jobModel');
const { getResume } = require('../models/resumeModel');
const { validateJobPayload } = require('./jobValidator');
const { analyzeResumeToJob } = require('./matchService');
const { categoryForScore, statusForScore } = require('./scoring');
const { SAMPLE_JOBS } = require('./sampleJobs');

function parseAnalysis(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function presentJob(row, { detail = false } = {}) {
  const analysis = parseAnalysis(row.analysis_json);
  const score = row.match_score === null || row.match_score === undefined ? null : Number(row.match_score);
  const job = {
    id: row.id,
    title: row.title,
    company: row.company,
    applicationUrl: row.application_url,
    status: row.status,
    matchScore: score,
    category: categoryForScore(score),
    topMatchingSkills: (analysis?.matchingSkills || []).slice(0, 4),
    missingSkills: (analysis?.missingSkills || []).slice(0, 4),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (detail) {
    job.description = row.description;
    job.analysis = analysis;
  }
  return job;
}

async function scoreAndStore(row) {
  const resume = getResume();
  if (!resume) {
    throw new HttpError(400, 'Upload a resume before running a match.');
  }
  const previousStatus = row.status;
  const previousScore = row.match_score;
  const analysis = await analyzeResumeToJob(resume.working_text, {
    title: row.title,
    company: row.company,
    description: row.description,
  });
  const status = statusForScore(analysis.matchScore, previousStatus);
  const updatedAt = new Date().toISOString();
  updateAnalysis(row.id, {
    status,
    matchScore: analysis.matchScore,
    analysisJson: JSON.stringify(analysis),
    updatedAt,
  });
  const updated = getJob(row.id);
  return {
    job: presentJob(updated, { detail: true }),
    becameReady: previousStatus !== 'ready_to_apply' && status === 'ready_to_apply',
    previousScore: previousScore === null || previousScore === undefined ? null : Number(previousScore),
  };
}

async function createJob(body) {
  const payload = validateJobPayload(body);
  const now = new Date().toISOString();
  const id = insertJob({
    ...payload,
    status: 'saved',
    matchScore: null,
    analysisJson: null,
    createdAt: now,
    updatedAt: now,
  });
  const created = getJob(id);
  if (getResume()) return scoreAndStore(created);
  return { job: presentJob(created, { detail: true }), becameReady: false, previousScore: null };
}

async function updateJob(id, body) {
  const existing = getJob(id);
  if (!existing) throw new HttpError(404, 'Job not found.');
  const payload = validateJobPayload(body);
  const now = new Date().toISOString();
  updateJobRecord(id, {
    ...payload,
    status: existing.status,
    matchScore: null,
    analysisJson: null,
    updatedAt: now,
  });
  const updated = getJob(id);
  if (getResume()) return scoreAndStore(updated);
  return { job: presentJob(updated, { detail: true }), becameReady: false, previousScore: null };
}

function removeJob(id) {
  const changes = deleteJob(id);
  if (!changes) throw new HttpError(404, 'Job not found.');
}

async function loadSamples() {
  let added = 0;
  let skipped = 0;
  const createdIds = [];
  SAMPLE_JOBS.forEach((sample) => {
    if (findByTitleCompany(sample.title, sample.company)) {
      skipped += 1;
      return;
    }
    const now = new Date().toISOString();
    const id = insertJob({
      title: sample.title,
      company: sample.company,
      description: sample.description.trim(),
      applicationUrl: sample.applicationUrl,
      status: 'saved',
      matchScore: null,
      analysisJson: null,
      createdAt: now,
      updatedAt: now,
    });
    createdIds.push(id);
    added += 1;
  });

  if (getResume()) {
    for (const id of createdIds) {
      const row = getJob(id);
      if (row) await scoreAndStore(row);
    }
  }

  return { added, skipped, jobs: listJobs().map((row) => presentJob(row)) };
}

async function analyzeJob(id) {
  const row = getJob(id);
  if (!row) throw new HttpError(404, 'Job not found.');
  return scoreAndStore(row);
}

async function analyzeAll() {
  const resume = getResume();
  if (!resume) throw new HttpError(400, 'Upload a resume before running a match.');
  const results = [];
  for (const row of listJobs()) {
    results.push(await scoreAndStore(row));
  }
  return {
    analyzed: results.length,
    jobs: results.map((result) => result.job),
  };
}

function setStatus(id, nextStatus) {
  const row = getJob(id);
  if (!row) throw new HttpError(404, 'Job not found.');
  let status = row.status;
  if (nextStatus === 'applied') status = 'applied';
  else if (nextStatus === 'reopen') status = statusForScore(row.match_score, 'saved');
  else throw new HttpError(400, 'Status must be applied or reopen.');

  updateAnalysis(id, {
    status,
    matchScore: row.match_score,
    analysisJson: row.analysis_json,
    updatedAt: new Date().toISOString(),
  });
  return presentJob(getJob(id), { detail: true });
}

function dashboard() {
  const resume = getResume();
  const jobs = listJobs().map((row) => presentJob(row));
  const active = jobs.filter((job) => job.status !== 'applied');
  const stats = {
    resumeUploaded: Boolean(resume),
    resumeName: resume ? resume.original_name : null,
    totalJobs: jobs.length,
    readyToApply: jobs.filter((job) => job.status === 'ready_to_apply').length,
    needsImprovement: jobs.filter((job) => job.status === 'needs_improvement').length,
    applied: jobs.filter((job) => job.status === 'applied').length,
    skillGap: jobs.filter((job) => job.category === 'gap' && job.status !== 'applied').length,
  };
  return {
    stats,
    groups: {
      ready: active.filter((job) => job.category === 'ready'),
      optimize: active.filter((job) => job.category === 'optimize'),
      gap: active.filter((job) => job.category === 'gap'),
      unscored: active.filter((job) => job.category === 'unscored'),
    },
  };
}

function list() {
  return listJobs().map((row) => presentJob(row));
}

function getDetail(id) {
  const row = getJob(id);
  if (!row) throw new HttpError(404, 'Job not found.');
  return presentJob(row, { detail: true });
}

module.exports = {
  createJob,
  updateJob,
  removeJob,
  loadSamples,
  analyzeJob,
  analyzeAll,
  setStatus,
  dashboard,
  list,
  getDetail,
};
