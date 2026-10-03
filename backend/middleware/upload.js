const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { HttpError } = require('./httpError');

const MAX_BYTES = 5 * 1024 * 1024;
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() === '.pdf' ? '.pdf' : '.pdf';
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1, fields: 2, parts: 4, fieldSize: 1024 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const pdfMime = !mime || mime === 'application/pdf' || mime === 'application/x-pdf' || mime === 'application/octet-stream';
    if (!name.endsWith('.pdf') || !pdfMime) {
      cb(new HttpError(400, 'Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
});

function uploadResume(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new HttpError(400, 'PDF must be 5 MB or smaller.'));
        return;
      }
      next(new HttpError(400, 'Could not upload that file.'));
      return;
    }
    next(err);
  });
}

module.exports = { uploadResume, uploadsDir, MAX_BYTES };
