const { HttpError } = require('../middleware/httpError');

function validateJobPayload(body) {
  const source = body || {};
  const title = String(source.title || '').trim();
  const company = String(source.company || '').trim();
  const description = String(source.description || '').trim();
  const urlRaw = source.applicationUrl == null ? '' : String(source.applicationUrl).trim();
  const errors = [];

  if (title.length < 2 || title.length > 140) errors.push('Job title must be between 2 and 140 characters.');
  if (company.length < 2 || company.length > 140) errors.push('Company must be between 2 and 140 characters.');
  if (description.length < 40 || description.length > 20000) {
    errors.push('Job description must be between 40 and 20,000 characters.');
  }

  let applicationUrl = null;
  if (urlRaw) {
    if (!/^https?:\/\//i.test(urlRaw)) {
      errors.push('Application URL must start with http:// or https://.');
    } else {
      try {
        const parsed = new URL(urlRaw);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.push('Application URL must start with http:// or https://.');
        } else {
          applicationUrl = parsed.toString();
        }
      } catch {
        errors.push('Application URL is not a valid link.');
      }
    }
  }

  if (errors.length) throw new HttpError(400, errors[0], errors);
  return { title, company, description, applicationUrl };
}

module.exports = { validateJobPayload };
