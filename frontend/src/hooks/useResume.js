import { useCallback, useEffect, useState } from 'react';
import { ResumeApi, errorMessage } from '../services/api';

export function useResume() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError('');
      const data = await ResumeApi.get();
      setResume(data.resume);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { resume, setResume, loading, error, setError, refresh };
}
