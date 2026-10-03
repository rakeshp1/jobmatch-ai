const { asyncHandler } = require('../middleware/asyncHandler');
const jobService = require('../services/jobService');

const getDashboard = asyncHandler(async (req, res) => {
  res.json(jobService.dashboard());
});

module.exports = { getDashboard };
