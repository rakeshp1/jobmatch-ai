const db = require('../database/db');

function listAccepted(jobId) {
  return db.prepare(`
    SELECT recommendation_id, improved_wording, created_at
    FROM accepted_recommendations
    WHERE job_id = ?
    ORDER BY datetime(created_at) ASC
  `).all(jobId);
}

function insertAccepted({ jobId, recommendationId, wording, createdAt }) {
  db.prepare(`
    INSERT INTO accepted_recommendations (job_id, recommendation_id, improved_wording, created_at)
    VALUES (?, ?, ?, ?)
  `).run(jobId, recommendationId, wording, createdAt);
}

module.exports = { listAccepted, insertAccepted };
