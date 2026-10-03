const { HttpError } = require('../middleware/httpError');

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function validateJobPayload(body) {
  const source = body && typeof body === 'object' ? body : {};
  const title = cleanText(source.title);
  const company = cleanText(source.company);
  const description = cleanText(source.description);
  const urlRaw = cleanText(source.applicationUrl);
  const errors = [];

  if (title.length < 2 || title.length > 140) errors.push('Job title must be between 2 and 140 characters.');
  if (company.length < 2 || company.length > 140) errors.push('Company must be between 2 and 140 characters.');
  if (description.length < 40 || description.length > 20000) {
    errors.push('Job description must be between 40 and 20,000 characters.');
  }

  let applicationUrl = null;
  if (urlRaw) {
    if (urlRaw.length > 2000) {
      errors.push('Application URL must be 2,000 characters or fewer.');
    } else if (!/^https?:\/\//i.test(urlRaw)) {
      errors.push('Application URL must start with http:// or https://.');
    } else {
      try {
        const parsed = new URL(urlRaw);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.push('Application URL must start with http:// or https://.');
        } else if (parsed.username || parsed.password) {
          errors.push('Application URL cannot include a username or password.');
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
