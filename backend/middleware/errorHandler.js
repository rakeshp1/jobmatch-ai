function notFound(req, res) {
  res.status(404).json({ error: 'That API route does not exist.' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request is too large.' });
    return;
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    res.status(409).json({ error: 'That change conflicted with data already saved. Refresh and try again.' });
    return;
  }

  const status = Number(err.status) || 500;
  if (status >= 500) console.error(err);
  const body = {
    error: status >= 500 ? 'Something went wrong on the server.' : err.message,
  };
  if (err.details) body.details = err.details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
