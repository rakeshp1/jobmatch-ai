import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { useJobs } from '../hooks/useJobs';
import { JobsApi, errorMessage } from '../services/api';
import { STATUS_LABEL } from '../utils/format';

const COLUMNS = [
  { status: 'saved', title: 'Saved', hint: 'Under 70% or not scored yet' },
  { status: 'needs_improvement', title: 'Needs Improvement', hint: '70–89% match' },
  { status: 'ready_to_apply', title: 'Ready to Apply', hint: '90% and above' },
  { status: 'applied', title: 'Applied', hint: 'Marked by you, not submitted externally' },
];

export function Applications() {
  const { jobs, loading, error, refresh } = useJobs();
  const [params] = useSearchParams();
  const focus = params.get('status');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    document.title = 'Applications · JobMatch AI';
  }, []);

  async function setStatus(job, status) {
    if (status === 'applied' && job.matchScore != null && job.matchScore < 90) {
      const ok = window.confirm('This match is under 90%. Mark it as applied anyway? Nothing is sent to the employer.');
      if (!ok) return;
    }
    setBusyId(job.id);
    setActionError('');
    try {
      await JobsApi.setStatus(job.id, status);
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Applications"
        title="Track what you will send"
        subtitle="Statuses are Saved, Needs Improvement, Ready to Apply, and Applied. Marking applied does not submit the application anywhere."
      />
      <ErrorBanner message={error || actionError} onRetry={refresh} />
      {loading && <LoadingState label="Loading applications…" />}
      {!loading && (
        <div className="board">
          {COLUMNS.map((column) => {
            const items = jobs.filter((job) => job.status === column.status);
            return (
              <section className={focus === column.status ? 'column focus' : 'column'} key={column.status}>
                <header>
                  <h2>{column.title}</h2>
                  <p>{items.length} · {column.hint}</p>
                </header>
                {items.length === 0 && <p className="muted">None in this status.</p>}
                {items.map((job) => (
                  <article className="app-card" key={job.id}>
                    <strong>{job.title}</strong>
                    <p className="company">{job.company}</p>
                    <p className="form-hint">{job.matchScore == null ? 'Not scored' : `${job.matchScore}% · ${STATUS_LABEL[job.status]}`}</p>
                    <div className="card-actions">
                      <Link className="btn btn-small btn-ghost" to={`/jobs/${job.id}`}>View</Link>
                      {job.matchScore != null && job.matchScore < 90 && (
                        <Link className="btn btn-small btn-ghost" to={`/jobs/${job.id}/improve`}>Improve</Link>
                      )}
                      {job.status !== 'applied' && (
                        <button className="btn btn-small" type="button" disabled={busyId === job.id} onClick={() => setStatus(job, 'applied')}>
                          {busyId === job.id ? 'Saving…' : 'Mark applied'}
                        </button>
                      )}
                      {job.status === 'applied' && (
                        <button className="btn btn-small btn-secondary" type="button" disabled={busyId === job.id} onClick={() => setStatus(job, 'reopen')}>
                          Move back
                        </button>
                      )}
                      {job.status === 'ready_to_apply' && job.applicationUrl && (
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => window.open(job.applicationUrl, '_blank', 'noopener,noreferrer')}>
                          Apply
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
