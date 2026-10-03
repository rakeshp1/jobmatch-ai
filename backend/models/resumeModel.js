const db = require('../database/db');

function getResume() {
  return db.prepare('SELECT * FROM resumes ORDER BY id DESC LIMIT 1').get() || null;
}

function insertResume(resume) {
  db.prepare(`
    INSERT INTO resumes (
      stored_name, original_name, extracted_text, working_text, skills_json, experience_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    resume.storedName,
    resume.originalName,
    resume.extractedText,
    resume.workingText,
    resume.skillsJson,
    resume.experienceJson,
    resume.createdAt,
  );
}

function updateWorkingText(id, workingText, skillsJson, experienceJson) {
  db.prepare('UPDATE resumes SET working_text = ?, skills_json = ?, experience_json = ? WHERE id = ?')
    .run(workingText, skillsJson, experienceJson, id);
}

function deleteResumes() {
  db.prepare('DELETE FROM resumes').run();
}

function deleteAcceptedRecommendations() {
  db.prepare('DELETE FROM accepted_recommendations').run();
}

module.exports = {
  getResume,
  insertResume,
  updateWorkingText,
  deleteResumes,
  deleteAcceptedRecommendations,
};
