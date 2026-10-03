import { useState } from 'react';
import { Link } from 'react-router-dom';
import { JobsApi, errorMessage } from '../services/api';
import { openHttpUrl } from '../utils/files';
import { CATEGORY_LABEL, STATUS_LABEL, categoryOf, initials } from '../utils/format';
import { SkillChips } from './SkillChips';

export function JobCard({ job, onChange, showManage = false }) {
  const band = job.category || categoryOf(job.matchScore);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function markApplied() {
    setBusy('apply');
    setError('');
    try {
      await JobsApi.setStatus(job.id, 'applied');
      if (onChange) await onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function runMatch() {
    setBusy('match');
    setError('');
    try {
      await JobsApi.analyze(job.id);
      if (onChange) await onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  function openApplication() {
    const problem = openHttpUrl(job.applicationUrl);
    if (problem) setError(problem);
  }

  const ready = job.matchScore != null && job.matchScore >= 90 && job.status !== 'applied';

  return (
    <article className="job-card">
      <div className="job-top">
        <div className="avatar" aria-hidden="true">{initials(job.company)}</div>
        <div>
          <h3>{job.title}</h3>
          <p className="company">{job.company}</p>
        </div>
        <div className="score-block">
          <div className={`score-num score-${band}`}>
            {job.matchScore == null ? '—' : <>{job.matchScore}<small>%</small></>}
          </div>
        </div>
      </div>
      <div className="track" aria-hidden="true">
        <span className={`fill-${band}`} style={{ width: `${job.matchScore || 0}%` }} />
      </div>
      <div className="badge-row">
        <span className={`badge badge-${job.status}`}>{STATUS_LABEL[job.status] || job.status}</span>
        <span className={`badge badge-${band}`}>{CATEGORY_LABEL[band]}</span>
      </div>
      <SkillChips label="Matching skills" items={job.topMatchingSkills} />
      <SkillChips label="Missing skills" items={job.missingSkills} tone="miss" />
      {error && <p className="field-error">{error}</p>}
      <div className="card-actions">
        <Link className="btn btn-small" to={`/jobs/${job.id}`} aria-label={`View analysis for ${job.title}`}>View Analysis</Link>
        {job.matchScore == null && (
          <button className="btn btn-small btn-secondary" type="button" onClick={runMatch} disabled={Boolean(busy)}>
            {busy === 'match' ? 'Scoring…' : 'Run match'}
          </button>
        )}
        {job.matchScore != null && job.matchScore < 90 && (
          <Link className="btn btn-small btn-secondary" to={`/jobs/${job.id}/improve`}>Improve Match</Link>
        )}
        {ready && job.applicationUrl && (
          <button className="btn btn-small btn-secondary" type="button" onClick={openApplication} aria-label={`Open application for ${job.title}`}>Apply</button>
        )}
        {ready && (
          <button className="btn btn-small btn-ghost" type="button" onClick={markApplied} disabled={Boolean(busy)} aria-label={`Mark ${job.title} as applied`}>
            {busy === 'apply' ? 'Saving…' : 'Mark applied'}
          </button>
        )}
        {showManage && <Link className="btn btn-small btn-ghost" to={`/jobs/${job.id}/edit`}>Edit</Link>}
      </div>
    </article>
  );
}
