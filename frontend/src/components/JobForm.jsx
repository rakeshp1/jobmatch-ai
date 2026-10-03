import { useState } from 'react';
import { validateJob } from '../utils/files';

const EMPTY = { title: '', company: '', description: '', applicationUrl: '' };

export function JobForm({ initial, submitLabel, busy, serverError, onSubmit }) {
  const [values, setValues] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateJob(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({
      title: values.title.trim(),
      company: values.company.trim(),
      description: values.description.trim(),
      applicationUrl: values.applicationUrl.trim(),
    });
  }

  return (
    <form className="form-card form-grid" onSubmit={handleSubmit} noValidate>
      {serverError && <div className="banner banner-error" role="alert">{serverError}</div>}
      <label>
        <span>Job title</span>
        <input value={values.title} onChange={(event) => update('title', event.target.value)} aria-invalid={Boolean(errors.title)} maxLength={140} required />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </label>
      <label>
        <span>Company</span>
        <input value={values.company} onChange={(event) => update('company', event.target.value)} aria-invalid={Boolean(errors.company)} maxLength={140} required />
        {errors.company && <p className="field-error">{errors.company}</p>}
      </label>
      <label>
        <span>Job description</span>
        <textarea value={values.description} onChange={(event) => update('description', event.target.value)} aria-invalid={Boolean(errors.description)} required />
        <div className="form-row">
          {errors.description ? <p className="field-error">{errors.description}</p> : <p className="form-hint">Paste the full posting. At least 40 characters.</p>}
          <p className="form-hint">{values.description.trim().length} characters</p>
        </div>
      </label>
      <label>
        <span>Application URL</span>
        <input value={values.applicationUrl} onChange={(event) => update('applicationUrl', event.target.value)} placeholder="https://" aria-invalid={Boolean(errors.applicationUrl)} />
        {errors.applicationUrl ? <p className="field-error">{errors.applicationUrl}</p> : <p className="form-hint">Optional. Apply opens this link in a new tab. Nothing is submitted for you.</p>}
      </label>
      <div>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
