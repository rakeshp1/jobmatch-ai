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

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
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
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
