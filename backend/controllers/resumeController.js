const { asyncHandler } = require('../middleware/asyncHandler');
const resumeService = require('../services/resumeService');
const jobService = require('../services/jobService');

const upload = asyncHandler(async (req, res) => {
  const row = await resumeService.saveUpload(req.file);
  await jobService.analyzeAll().catch((error) => {
    console.warn(error.message);
  });
  res.status(201).json({ resume: resumeService.presentResume(row) });
});

const uploadSample = asyncHandler(async (req, res) => {
  const row = await resumeService.installSampleResume();
  await jobService.analyzeAll().catch((error) => {
    console.warn(error.message);
  });
  res.status(201).json({ resume: resumeService.presentResume(resumeService.getResume() || row) });
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
  await jobService.analyzeAll().catch((error) => {
    console.warn(error.message);
  });
  res.json({ resume: resumeService.presentResume(resumeService.getResume()) });
});

module.exports = { upload, uploadSample, samplePdf, get, remove, resetTailoring };
