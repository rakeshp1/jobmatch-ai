const express = require('express');
const jobController = require('../controllers/jobController');

const router = express.Router();

router.post('/samples', jobController.loadSamples);
router.post('/analyze-all', jobController.analyzeAll);
router.get('/', jobController.list);
router.post('/', jobController.create);
router.get('/:id/improve', jobController.improve);
router.post('/:id/improve/accept', jobController.accept);
router.post('/:id/analyze', jobController.analyze);
router.patch('/:id/status', jobController.setStatus);
router.get('/:id', jobController.detail);
router.put('/:id', jobController.update);
router.delete('/:id', jobController.remove);

module.exports = router;
