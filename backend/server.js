const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');

const port = Number(process.env.PORT) || 43124;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`JobMatch AI API listening on http://127.0.0.1:${port}`);
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
