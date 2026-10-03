const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const { HttpError } = require('../middleware/httpError');
const { uploadsDir } = require('../middleware/upload');
const {
  getResume,
  insertResume,
  updateWorkingText,
  deleteResumes,
  deleteAcceptedRecommendations,
} = require('../models/resumeModel');
const { clearAnalyses } = require('../models/jobModel');
const { detectSkills, extractExperience } = require('./textAnalysis');
const { extractPdfText } = require('./pdfService');
const { buildTextPdf } = require('./pdfBuilder');
const { SAMPLE_RESUME_PARAGRAPHS, SAMPLE_RESUME_FILENAME } = require('./sampleResume');

function safeUploadPath(storedName) {
  const root = path.resolve(uploadsDir);
  const full = path.resolve(root, storedName);
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) {
    throw new HttpError(400, 'Invalid uploaded file name.');
  }
  return full;
}

function presentResume(row) {
  if (!row) return null;
  return {
    id: row.id,
    originalName: row.original_name,
    extractedText: row.extracted_text,
    workingText: row.working_text,
    skills: JSON.parse(row.skills_json),
    experience: JSON.parse(row.experience_json),
    hasTailoring: row.working_text.trim() !== row.extracted_text.trim(),
    createdAt: row.created_at,
  };
}

function refreshDerived(id) {
  const row = db.prepare('SELECT working_text FROM resumes WHERE id = ?').get(id);
  if (!row) return;
  updateWorkingText(
    id,
    row.working_text,
    JSON.stringify(detectSkills(row.working_text)),
    JSON.stringify(extractExperience(row.working_text)),
  );
}

async function ingestStoredPdf({ storedName, originalName }) {
  const fullPath = safeUploadPath(storedName);
  const buffer = fs.readFileSync(fullPath);
  if (buffer.length < 5 || buffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
    fs.unlinkSync(fullPath);
    throw new HttpError(400, 'That file is not a valid PDF.');
  }

  let text;
  try {
    text = await extractPdfText(buffer);
  } catch (error) {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    throw error;
  }

  if (!text || text.length < 40) {
    fs.unlinkSync(fullPath);
    throw new HttpError(400, 'No selectable text found. Scanned image PDFs are not supported. Export a text-based PDF and try again.');
  }

  const previous = getResume();
  const now = new Date().toISOString();
  const replace = db.transaction(() => {
    deleteAcceptedRecommendations();
    deleteResumes();
    insertResume({
      storedName,
      originalName,
      extractedText: text,
      workingText: text,
      skillsJson: JSON.stringify(detectSkills(text)),
      experienceJson: JSON.stringify(extractExperience(text)),
      createdAt: now,
    });
    clearAnalyses(now);
  });
  replace();

  if (previous && previous.stored_name !== storedName) {
    const previousPath = safeUploadPath(previous.stored_name);
    if (fs.existsSync(previousPath)) fs.unlinkSync(previousPath);
  }

  return getResume();
}

async function saveUpload(file) {
  if (!file) throw new HttpError(400, 'Choose a PDF resume to upload.');
  return ingestStoredPdf({
    storedName: file.filename,
    originalName: path.basename(file.originalname || 'resume.pdf'),
  });
}

async function installSampleResume() {
  const storedName = `${Date.now()}-sample-data-engineer-resume.pdf`;
  const buffer = await buildTextPdf(SAMPLE_RESUME_PARAGRAPHS);
  fs.writeFileSync(safeUploadPath(storedName), buffer);
  return ingestStoredPdf({ storedName, originalName: SAMPLE_RESUME_FILENAME });
}

async function samplePdfBuffer() {
  return buildTextPdf(SAMPLE_RESUME_PARAGRAPHS);
}

function removeResume() {
  const existing = getResume();
  if (!existing) return false;
  const now = new Date().toISOString();
  const remove = db.transaction(() => {
    deleteAcceptedRecommendations();
    deleteResumes();
    clearAnalyses(now);
  });
  remove();
  const fullPath = safeUploadPath(existing.stored_name);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  return true;
}

function resetTailoring() {
  const existing = getResume();
  if (!existing) throw new HttpError(400, 'Upload a resume first.');
  const reset = db.transaction(() => {
    deleteAcceptedRecommendations();
    updateWorkingText(
      existing.id,
      existing.extracted_text,
      JSON.stringify(detectSkills(existing.extracted_text)),
      JSON.stringify(extractExperience(existing.extracted_text)),
    );
  });
  reset();
  return getResume();
}

module.exports = {
  presentResume,
  refreshDerived,
  saveUpload,
  installSampleResume,
  samplePdfBuffer,
  removeResume,
  resetTailoring,
  getResume,
};
