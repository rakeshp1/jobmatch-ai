import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Feedback';
import { JobForm } from '../components/JobForm';
import { LoadSamplesButton } from '../components/LoadSamplesButton';
import { JobsApi, errorMessage } from '../services/api';

export function AddJob() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    document.title = 'Add job · JobMatch AI';
  }, []);

  async function onSubmit(values) {
    setBusy(true);
    setServerError('');
    try {
      const result = await JobsApi.create(values);
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
        eyebrow="Add job"
        title="Put a posting on the board"
        subtitle="If a resume is already uploaded, the match score is calculated as soon as you save."
        actions={<LoadSamplesButton onLoaded={() => navigate('/matches')} />}
      />
      <JobForm submitLabel="Save and score" busy={busy} serverError={serverError} onSubmit={onSubmit} />
    </section>
  );
}
