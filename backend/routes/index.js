const express = require('express');
const resumeRoutes = require('./resumeRoutes');
const jobRoutes = require('./jobRoutes');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'jobmatch-ai',
    matcher: (process.env.AI_API_KEY || '').trim() ? 'ai-with-local-fallback' : 'local',
    time: new Date().toISOString(),
  });
});

router.get('/dashboard', getDashboard);
router.use('/resume', resumeRoutes);
router.use('/jobs', jobRoutes);

module.exports = router;
