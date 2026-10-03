import { useRef, useState } from 'react';
import { JobsApi, errorMessage } from '../services/api';

export function LoadSamplesButton({ onLoaded, variant = 'secondary' }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function load() {
    if (lock.current) return;
    lock.current = true;
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
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <div>
      <button className={`btn btn-${variant}`} type="button" onClick={load} disabled={busy}>
        {busy ? 'Loading samples…' : 'Load sample jobs'}
      </button>
      {message && <p className="form-hint" role="status">{message}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
