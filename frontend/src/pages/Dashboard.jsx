import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Disclaimer, EmptyState, ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { JobCard } from '../components/JobCard';
import { LoadSamplesButton } from '../components/LoadSamplesButton';
import { useDashboard } from '../hooks/useDashboard';

const SECTIONS = [
  { key: 'ready', title: 'Ready to Apply', hint: '90–100%', rail: 'rail-ready' },
  { key: 'optimize', title: 'Resume Optimization Recommended', hint: '70–89%', rail: 'rail-optimize' },
  { key: 'gap', title: 'Significant Skill Gap', hint: 'Below 70%', rail: 'rail-gap' },
  { key: 'unscored', title: 'Not analyzed yet', hint: 'Upload a resume or run a match', rail: 'rail-unscored' },
];

export function Dashboard() {
  const { data, loading, error, refresh } = useDashboard();

  useEffect(() => {
    document.title = 'Dashboard · JobMatch AI';
  }, []);

  const stats = data?.stats;
  const subtitle = !stats
    ? 'See which roles are ready, which need a sharper resume, and which are already out the door.'
    : !stats.resumeUploaded
      ? 'Upload a resume to start scoring roles against your real experience.'
      : !stats.totalJobs
        ? 'Add a job description, or load samples, to see where your resume stands.'
        : `${stats.readyToApply} ready to apply · ${stats.needsImprovement} in the optimization band · ${stats.skillGap} with a significant skill gap · ${stats.applied} applied.`;

  return (
    <section>
      <PageHeader
        eyebrow="Pipeline"
        title="Where your search stands"
        subtitle={subtitle}
        actions={(
          <>
            <Link className="btn" to="/jobs/new">Add job</Link>
            <LoadSamplesButton onLoaded={refresh} />
          </>
        )}
      />
      <Disclaimer />
      <ErrorBanner message={error} onRetry={refresh} />
      {loading && <LoadingState label="Loading your pipeline…" />}
      {!loading && stats && (
        <>
          {!stats.resumeUploaded && (
            <div className="banner banner-info">
              <span>No resume yet. Scores stay blank until a PDF is on file.</span>
              <Link className="btn btn-small" to="/resume">Upload resume</Link>
            </div>
          )}
          <div className="stat-grid">
            <Link className="stat" to="/resume">
              <span>Resume uploaded</span>
              <strong>{stats.resumeUploaded ? 'Yes' : 'No'}</strong>
              <em>{stats.resumeName || 'PDF not on file'}</em>
            </Link>
            <Link className="stat" to="/matches">
              <span>Total jobs</span>
              <strong>{stats.totalJobs}</strong>
              <em>Tracked descriptions</em>
            </Link>
            <Link className="stat" to="/applications?status=ready_to_apply">
              <span>Ready to apply</span>
              <strong>{stats.readyToApply}</strong>
              <em>90% and above</em>
            </Link>
            <Link className="stat" to="/applications?status=needs_improvement">
              <span>Needs improvement</span>
              <strong>{stats.needsImprovement}</strong>
              <em>70–89% match</em>
            </Link>
            <Link className="stat" to="/applications?status=applied">
              <span>Applied jobs</span>
              <strong>{stats.applied}</strong>
              <em>Marked by you</em>
            </Link>
          </div>
          {stats.totalJobs === 0 && (
            <EmptyState title="No roles yet" body="Add a posting you are considering, or load four sample data roles to see how the scores spread.">
              <LoadSamplesButton onLoaded={refresh} variant="primary" />
            </EmptyState>
          )}
          {SECTIONS.map((section) => {
            const jobs = data.groups?.[section.key] || [];
            if (!jobs.length) return null;
            return (
              <section className="section" key={section.key}>
                <div className={`section-head rail ${section.rail}`}>
                  <h2>{section.title}</h2>
                  <span className="muted">{jobs.length} · {section.hint}</span>
                </div>
                <div className="card-grid">
                  {jobs.map((job) => <JobCard key={job.id} job={job} onChange={refresh} />)}
                </div>
              </section>
            );
          })}
        </>
      )}
    </section>
  );
}
