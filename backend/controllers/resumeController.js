const { asyncHandler } = require('../middleware/asyncHandler');
const resumeService = require('../services/resumeService');
const jobService = require('../services/jobService');

async function refreshScores() {
  try {
    await jobService.analyzeAll();
    return { scoresRefreshed: true, scoreWarning: '' };
  } catch (error) {
    console.warn(error.message);
    return {
      scoresRefreshed: false,
      scoreWarning: 'The resume was saved, but match scores could not be refreshed. Re-run matches from Job Matches.',
    };
  }
}

const upload = asyncHandler(async (req, res) => {
  const row = await resumeService.saveUpload(req.file);
  const scores = await refreshScores();
  res.status(201).json({ resume: resumeService.presentResume(row), ...scores });
});

const uploadSample = asyncHandler(async (req, res) => {
  const row = await resumeService.installSampleResume();
  const scores = await refreshScores();
  res.status(201).json({ resume: resumeService.presentResume(resumeService.getResume() || row), ...scores });
});

const samplePdf = asyncHandler(async (req, res) => {
  const buffer = await resumeService.samplePdfBuffer();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="sample-data-engineer-resume.pdf"');
  res.send(buffer);
});

const get = asyncHandler(async (req, res) => {
  res.json({ resume: resumeService.presentResume(resumeService.getResume()) });
});

const remove = asyncHandler(async (req, res) => {
  const removed = resumeService.removeResume();
  res.json({ removed });
});

const resetTailoring = asyncHandler(async (req, res) => {
  resumeService.resetTailoring();
  const scores = await refreshScores();
  res.json({ resume: resumeService.presentResume(resumeService.getResume()), ...scores });
});

module.exports = { upload, uploadSample, samplePdf, get, remove, resetTailoring };
