const express = require('express');
const { uploadResume } = require('../middleware/upload');
const resumeController = require('../controllers/resumeController');

const router = express.Router();

router.get('/sample.pdf', resumeController.samplePdf);
router.post('/sample', resumeController.uploadSample);
router.post('/reset-tailoring', resumeController.resetTailoring);
router.post('/', uploadResume, resumeController.upload);
router.get('/', resumeController.get);
router.delete('/', resumeController.remove);

module.exports = router;
