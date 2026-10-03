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
  if (url.length > 2000) {
    errors.applicationUrl = 'Application URL must be 2,000 characters or fewer.';
  } else if (url && !/^https?:\/\/.+/i.test(url)) {
    errors.applicationUrl = 'Application URL must start with http:// or https://.';
  } else if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.applicationUrl = 'Application URL must start with http:// or https://.';
      } else if (parsed.username || parsed.password) {
        errors.applicationUrl = 'Application URL cannot include a username or password.';
      }
    } catch {
      errors.applicationUrl = 'Application URL is not a valid link.';
    }
  }
  return errors;
}

const UNFILLED_DRAFT = /\[\[|describe the real workload|a result you can support|name only tools you have used/i;

export function draftWordingError(text) {
  const wording = String(text || '').trim();
  if (wording.length < 25 || wording.length > 500) {
    return 'Write 25 to 500 characters of experience you can support.';
  }
  if (UNFILLED_DRAFT.test(wording)) {
    return 'Replace the [[placeholders]] with real experience, or leave this suggestion unselected.';
  }
  return '';
}

export function openHttpUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url || ''));
  } catch {
    return 'That application link could not be opened.';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Application links must start with http:// or https://.';
  }
  if (parsed.username || parsed.password) {
    return 'That application link includes a username or password and was not opened.';
  }
  const opened = window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
  if (!opened) return 'The browser blocked the new tab. Allow pop-ups for this site and try again.';
  return '';
}
