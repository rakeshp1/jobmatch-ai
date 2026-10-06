const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://127.0.0.1:43123,http://localhost:43123')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function originAllowed(origin, hostHeader) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    return Boolean(hostHeader) && new URL(origin).host === hostHeader;
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
  const origin = req.headers.origin;
  if (origin && !originAllowed(origin, req.headers.host)) {
    res.status(403).json({ error: 'This origin is not allowed to call the API.' });
    return;
  }
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));

app.use(express.json({ limit: '1mb' }));
app.get('/ping', (req, res) => {
  res.type('text/plain').send('ok');
});
app.use('/api', routes);

const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '..', 'frontend', 'dist');
const indexFile = path.join(frontendDist, 'index.html');
if (fs.existsSync(indexFile)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    if (req.path.startsWith('/api') || path.extname(req.path)) {
      next();
      return;
    }
    res.sendFile(indexFile, (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
