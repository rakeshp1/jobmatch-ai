import { useState } from 'react';
import { JobsApi, errorMessage } from '../services/api';

export function LoadSamplesButton({ onLoaded, variant = 'secondary' }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await JobsApi.loadSamples();
      const note = result.added
        ? `Added ${result.added} sample job${result.added === 1 ? '' : 's'}${result.skipped ? ` and skipped ${result.skipped} already saved` : ''}.`
        : 'Sample jobs are already in your list.';
      setMessage(note);
      if (onLoaded) await onLoaded(result);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className={`btn btn-${variant}`} type="button" onClick={load} disabled={busy}>
        {busy ? 'Loading samples…' : 'Load sample jobs'}
      </button>
      {message && <p className="form-hint">{message}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
