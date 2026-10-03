import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { JobCard } from '../components/JobCard';
import { LoadSamplesButton } from '../components/LoadSamplesButton';
import { useJobs } from '../hooks/useJobs';
import { JobsApi, errorMessage } from '../services/api';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'gap', label: 'Skill gap' },
  { id: 'unscored', label: 'Not scored' },
];

export function JobMatches() {
  const { jobs, loading, error, refresh } = useJobs();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    document.title = 'Job matches · JobMatch AI';
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const bandOk = filter === 'all' || job.category === filter;
      const text = `${job.title} ${job.company}`.toLowerCase();
      return bandOk && (!needle || text.includes(needle));
    });
  }, [jobs, filter, query]);

  async function rerun() {
    setBusy(true);
    setActionError('');
    setNotice('');
    try {
      const result = await JobsApi.analyzeAll();
      setNotice(`Re-scored ${result.analyzed} job${result.analyzed === 1 ? '' : 's'}.`);
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Job matches"
        title="Every role next to your resume"
        subtitle="Open an analysis, improve wording under 90%, or edit the posting and score it again."
        actions={(
          <>
            <Link className="btn" to="/jobs/new">Add job</Link>
            <button className="btn btn-secondary" type="button" onClick={rerun} disabled={busy || !jobs.length}>
              {busy ? 'Scoring…' : 'Re-run all matches'}
            </button>
            <LoadSamplesButton onLoaded={refresh} />
          </>
        )}
      />
      <ErrorBanner message={error || actionError} onRetry={refresh} />
      {notice && <div className="banner banner-ok" role="status">{notice}</div>}
      <div className="toolbar">
        {FILTERS.map((item) => (
          <button key={item.id} className={filter === item.id ? 'btn btn-small' : 'btn btn-small btn-ghost'} type="button" onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
        <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or company" aria-label="Search jobs" />
      </div>
      {loading && <LoadingState label="Loading jobs…" />}
      {!loading && jobs.length === 0 && (
        <EmptyState title="Nothing to compare yet" body="Add your own posting or load the sample data roles.">
          <LoadSamplesButton onLoaded={refresh} variant="primary" />
        </EmptyState>
      )}
      {!loading && jobs.length > 0 && visible.length === 0 && (
        <EmptyState title="No jobs in this view" body="Clear the search or switch filters." />
      )}
      <div className="card-grid">
        {visible.map((job) => <JobCard key={job.id} job={job} onChange={refresh} showManage />)}
      </div>
    </section>
  );
}
