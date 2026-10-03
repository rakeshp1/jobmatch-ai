const MAX_BYTES = 5 * 1024 * 1024;

export function validatePdf(file) {
  if (!file) return 'Choose a PDF resume.';
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (!name.endsWith('.pdf')) return 'Only PDF files are allowed.';
  if (type && type !== 'application/pdf' && type !== 'application/x-pdf' && type !== 'application/octet-stream') {
    return 'Only PDF files are allowed.';
  }
  if (file.size === 0) return 'That PDF is empty.';
  if (file.size > MAX_BYTES) return 'PDF must be 5 MB or smaller.';
  return '';
}

export function validateJob(values) {
  const errors = {};
  const title = values.title.trim();
  const company = values.company.trim();
  const description = values.description.trim();
  const url = values.applicationUrl.trim();

  if (title.length < 2 || title.length > 140) errors.title = 'Job title must be between 2 and 140 characters.';
  if (company.length < 2 || company.length > 140) errors.company = 'Company must be between 2 and 140 characters.';
  if (description.length < 40 || description.length > 20000) {
    errors.description = 'Job description must be between 40 and 20,000 characters.';
  }
  if (url && !/^https?:\/\/.+/i.test(url)) {
    errors.applicationUrl = 'Application URL must start with http:// or https://.';
  }
  return errors;
}
