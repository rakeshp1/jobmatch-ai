import { useRef, useState } from 'react';
import { validateJob } from '../utils/files';

const EMPTY = { title: '', company: '', description: '', applicationUrl: '' };

export function JobForm({ initial, submitLabel, busy, serverError, onSubmit }) {
  const [values, setValues] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const lock = useRef(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (lock.current) return;
    const nextErrors = validateJob(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    lock.current = true;
    try {
      await onSubmit({
        title: values.title.trim(),
        company: values.company.trim(),
        description: values.description.trim(),
        applicationUrl: values.applicationUrl.trim(),
      });
    } finally {
      lock.current = false;
    }
  }

  return (
    <form className="form-card form-grid" onSubmit={handleSubmit} noValidate>
      {serverError && <div className="banner banner-error" role="alert">{serverError}</div>}
      <div>
        <label htmlFor="job-title">Job title</label>
        <input id="job-title" value={values.title} onChange={(event) => update('title', event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'job-title-error' : undefined} maxLength={140} required />
        {errors.title && <p id="job-title-error" className="field-error" role="alert">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="job-company">Company</label>
        <input id="job-company" value={values.company} onChange={(event) => update('company', event.target.value)} aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? 'job-company-error' : undefined} maxLength={140} required />
        {errors.company && <p id="job-company-error" className="field-error" role="alert">{errors.company}</p>}
      </div>
      <div>
        <label htmlFor="job-description">Job description</label>
        <textarea id="job-description" value={values.description} onChange={(event) => update('description', event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'job-description-error' : 'job-description-hint'} maxLength={20000} required />
        <div className="form-row">
          {errors.description
            ? <p id="job-description-error" className="field-error" role="alert">{errors.description}</p>
            : <p id="job-description-hint" className="form-hint">Paste the full posting. At least 40 characters.</p>}
          <p className="form-hint">{values.description.trim().length} / 20,000</p>
        </div>
      </div>
      <div>
        <label htmlFor="job-url">Application URL</label>
        <input id="job-url" value={values.applicationUrl} onChange={(event) => update('applicationUrl', event.target.value)} placeholder="https://" aria-invalid={Boolean(errors.applicationUrl)} aria-describedby={errors.applicationUrl ? 'job-url-error' : 'job-url-hint'} maxLength={2000} inputMode="url" />
        {errors.applicationUrl
          ? <p id="job-url-error" className="field-error" role="alert">{errors.applicationUrl}</p>
          : <p id="job-url-hint" className="form-hint">Optional. Apply opens this link in a new tab. Nothing is submitted for you.</p>}
      </div>
      <div>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
