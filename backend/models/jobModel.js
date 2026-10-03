const db = require('../database/db');

function listJobs() {
  return db.prepare('SELECT * FROM jobs ORDER BY updated_at DESC, id DESC').all();
}

function getJob(id) {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) || null;
}

function findByTitleCompany(title, company) {
  return db.prepare(`
    SELECT * FROM jobs
    WHERE lower(title) = lower(?) AND lower(company) = lower(?)
  `).get(title, company) || null;
}

function insertJob(job) {
  const result = db.prepare(`
    INSERT INTO jobs (
      title, company, description, application_url, status, match_score, analysis_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.title,
    job.company,
    job.description,
    job.applicationUrl,
    job.status,
    job.matchScore,
    job.analysisJson,
    job.createdAt,
    job.updatedAt,
  );
  return Number(result.lastInsertRowid);
}

function updateJobRecord(id, job) {
  db.prepare(`
    UPDATE jobs
    SET title = ?, company = ?, description = ?, application_url = ?, status = ?,
        match_score = ?, analysis_json = ?, updated_at = ?
    WHERE id = ?
  `).run(
    job.title,
    job.company,
    job.description,
    job.applicationUrl,
    job.status,
    job.matchScore,
    job.analysisJson,
    job.updatedAt,
    id,
  );
}

function updateAnalysis(id, fields) {
  db.prepare(`
    UPDATE jobs
    SET status = ?, match_score = ?, analysis_json = ?, updated_at = ?
    WHERE id = ?
  `).run(fields.status, fields.matchScore, fields.analysisJson, fields.updatedAt, id);
}

function clearAnalyses(updatedAt) {
  db.prepare(`
    UPDATE jobs
    SET match_score = NULL,
        analysis_json = NULL,
        status = CASE WHEN status = 'applied' THEN 'applied' ELSE 'saved' END,
        updated_at = ?
  `).run(updatedAt);
}

function deleteJob(id) {
  return db.prepare('DELETE FROM jobs WHERE id = ?').run(id).changes;
}

module.exports = {
  listJobs,
  getJob,
  findByTitleCompany,
  insertJob,
  updateJobRecord,
  updateAnalysis,
  clearAnalyses,
  deleteJob,
};
