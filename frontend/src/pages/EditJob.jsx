import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { JobForm } from '../components/JobForm';
import { JobsApi, errorMessage } from '../services/api';

export function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Edit job · JobMatch AI';
    let cancelled = false;
    JobsApi.get(id)
      .then((data) => { if (!cancelled) setJob(data.job); })
      .catch((err) => { if (!cancelled) setLoadError(errorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function onSubmit(values) {
    setBusy(true);
    setServerError('');
    try {
      const result = await JobsApi.update(id, values);
      navigate(`/jobs/${result.job.id}`);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Edit job"
        title={job ? job.title : 'Edit job'}
        subtitle="Saving recalculates the match when a resume is on file."
        actions={<Link className="btn btn-ghost" to={job ? `/jobs/${job.id}` : '/matches'}>Back</Link>}
      />
      {loading && <LoadingState label="Loading job…" />}
      <ErrorBanner message={loadError} />
      {job && (
        <JobForm
          initial={{
            title: job.title,
            company: job.company,
            description: job.description,
            applicationUrl: job.applicationUrl || '',
          }}
          submitLabel="Save changes"
          busy={busy}
          serverError={serverError}
          onSubmit={onSubmit}
        />
      )}
    </section>
  );
}
