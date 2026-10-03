import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Disclaimer, ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { ScoreRing } from '../components/ScoreRing';
import { SkillChips } from '../components/SkillChips';
import { JobsApi, errorMessage } from '../services/api';
import { CATEGORY_LABEL, STATUS_LABEL, categoryOf } from '../utils/format';

export function JobAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    setError('');
    try {
      const data = await JobsApi.get(id);
      setJob(data.job);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Analysis · JobMatch AI';
    load();
  }, [id]);

  async function rerun() {
    setBusy('score');
    setNotice('');
    setError('');
    try {
      const result = await JobsApi.analyze(id);
      setJob(result.job);
      const moved = result.previousScore != null ? ` Score moved from ${result.previousScore}% to ${result.job.matchScore}%.` : '';
      setNotice(result.becameReady
        ? `This role is now Ready to Apply.${moved}`
        : `Match updated.${moved}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function markApplied() {
    setBusy('apply');
    setError('');
    try {
      const data = await JobsApi.setStatus(id, 'applied');
      setJob(data.job);
      setNotice('Marked as applied. Nothing was sent to the employer.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      await JobsApi.remove(id);
      navigate('/matches');
    } catch (err) {
      setError(errorMessage(err));
      setBusy('');
      setConfirmDelete(false);
    }
  }

  const band = job ? categoryOf(job.matchScore) : 'unscored';
  const analysis = job?.analysis;

  return (
    <section>
      <PageHeader
        eyebrow="Analysis"
        title={job ? job.title : 'Job analysis'}
        subtitle={job ? job.company : 'How this description overlaps your resume.'}
        actions={job && (
          <>
            <Link className="btn btn-ghost" to={`/jobs/${job.id}/edit`}>Edit</Link>
            <button className="btn btn-secondary" type="button" onClick={rerun} disabled={Boolean(busy)}>
              {busy === 'score' ? 'Scoring…' : 'Re-run match'}
            </button>
            <button className="btn btn-danger" type="button" onClick={() => setConfirmDelete(true)}>Delete</button>
          </>
        )}
      />
      <Disclaimer />
      {notice && <div className="banner banner-ok" role="status">{notice}</div>}
      <ErrorBanner message={error} onRetry={load} />
      {loading && <LoadingState label="Loading analysis…" />}
      {job && (
        <div className="panel">
          <div className="analysis-hero">
            <ScoreRing score={job.matchScore} />
            <div>
              <div className="badge-row">
                <span className={`badge badge-${band}`}>{CATEGORY_LABEL[band]}</span>
                <span className={`badge badge-${job.status}`}>{STATUS_LABEL[job.status]}</span>
              </div>
              <p style={{ marginTop: 12, lineHeight: 1.5 }}>{analysis?.explanation || 'Run a match after uploading a resume to see why a score was assigned.'}</p>
              <div className="card-actions" style={{ marginTop: 14 }}>
                {job.matchScore != null && job.matchScore < 90 && (
                  <Link className="btn btn-small" to={`/jobs/${job.id}/improve`}>Improve Match</Link>
                )}
                {job.matchScore != null && job.matchScore >= 90 && job.applicationUrl && (
                  <button className="btn btn-small" type="button" onClick={() => window.open(job.applicationUrl, '_blank', 'noopener,noreferrer')}>
                    Apply
                  </button>
                )}
                {job.status !== 'applied' && job.matchScore != null && job.matchScore >= 90 && (
                  <button className="btn btn-small btn-secondary" type="button" onClick={markApplied} disabled={Boolean(busy)}>
                    {busy === 'apply' ? 'Saving…' : 'Mark applied'}
                  </button>
                )}
                {job.matchScore == null && (
                  <button className="btn btn-small" type="button" onClick={rerun} disabled={Boolean(busy)}>Run match</button>
                )}
              </div>
              {job.matchScore != null && job.matchScore >= 90 && !job.applicationUrl && (
                <p className="form-hint">No application URL is saved. You can still mark the job as applied.</p>
              )}
            </div>
          </div>
          <div className="detail-grid">
            <div>
              <h3>Matching skills</h3>
              <SkillChips items={analysis?.matchingSkills || job.topMatchingSkills} />
            </div>
            <div>
              <h3>Missing skills</h3>
              <SkillChips items={analysis?.missingSkills || job.missingSkills} tone="miss" />
            </div>
            <div>
              <h3>Missing keywords</h3>
              <SkillChips items={analysis?.missingKeywords || []} tone="miss" />
            </div>
            <div>
              <h3>Experience gaps</h3>
              {analysis?.experienceGaps?.length ? (
                <ul className="plain-list">
                  {analysis.experienceGaps.map((gap) => <li key={gap}>{gap}</li>)}
                </ul>
              ) : <p className="muted">None detected.</p>}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <h3>Resume improvement recommendations</h3>
            {analysis?.recommendations?.length ? (
              <ul className="plain-list">
                {analysis.recommendations.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : <p className="muted">Run a match to generate recommendations.</p>}
            <p className="form-hint">
              {analysis?.provider === 'openai' ? 'Scored with the configured AI provider, with the local matcher as fallback.' : 'Scored with the local matcher: keyword overlap, skill matching, weighted requirements, and resume keyword frequency.'}
            </p>
          </div>
          <details style={{ marginTop: 16 }}>
            <summary>Job description</summary>
            <pre className="text-panel">{job.description}</pre>
          </details>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${job?.title || 'this job'}?`}
          body="This removes the match and any accepted suggestions for this role."
          confirmLabel="Delete job"
          busy={busy === 'delete'}
          onConfirm={remove}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </section>
  );
}
