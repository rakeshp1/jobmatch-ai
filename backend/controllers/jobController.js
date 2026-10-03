const { asyncHandler } = require('../middleware/asyncHandler');
const { HttpError } = require('../middleware/httpError');
const jobService = require('../services/jobService');
const improveService = require('../services/improveService');

function parseId(value) {
  if (!/^[1-9]\d{0,14}$/.test(String(value))) throw new HttpError(400, 'Invalid job id.');
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new HttpError(400, 'Invalid job id.');
  return id;
}

const list = asyncHandler(async (req, res) => {
  res.json({ jobs: jobService.list() });
});

const create = asyncHandler(async (req, res) => {
  const result = await jobService.createJob(req.body);
  res.status(201).json(result);
});

const loadSamples = asyncHandler(async (req, res) => {
  const result = await jobService.loadSamples();
  res.status(201).json(result);
});

const detail = asyncHandler(async (req, res) => {
  res.json({ job: jobService.getDetail(parseId(req.params.id)) });
});

const update = asyncHandler(async (req, res) => {
  const result = await jobService.updateJob(parseId(req.params.id), req.body);
  res.json(result);
});

const remove = asyncHandler(async (req, res) => {
  jobService.removeJob(parseId(req.params.id));
  res.json({ deleted: true });
});

const analyze = asyncHandler(async (req, res) => {
  const result = await jobService.analyzeJob(parseId(req.params.id));
  res.json(result);
});

const analyzeAll = asyncHandler(async (req, res) => {
  res.json(await jobService.analyzeAll());
});

const setStatus = asyncHandler(async (req, res) => {
  const job = jobService.setStatus(parseId(req.params.id), req.body?.status);
  res.json({ job });
});

const improve = asyncHandler(async (req, res) => {
  res.json({ plan: improveService.getPlan(parseId(req.params.id)) });
});

const accept = asyncHandler(async (req, res) => {
  const result = improveService.acceptRecommendations(parseId(req.params.id), req.body);
  res.json(result);
});

module.exports = {
  list,
  create,
  loadSamples,
  detail,
  update,
  remove,
  analyze,
  analyzeAll,
  setStatus,
  improve,
  accept,
};
