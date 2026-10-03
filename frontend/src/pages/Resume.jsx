import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Disclaimer, ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { SkillChips } from '../components/SkillChips';
import { useResume } from '../hooks/useResume';
import { ResumeApi, errorMessage } from '../services/api';
import { formatDate } from '../utils/format';
import { validatePdf } from '../utils/files';

export function Resume() {
  const { resume, setResume, loading, error, setError, refresh } = useResume();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    document.title = 'Resume · JobMatch AI';
  }, []);

  async function send(file) {
    const problem = validatePdf(file);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('upload');
    setError('');
    setNotice('');
    try {
      const data = await ResumeApi.upload(file);
      setResume(data.resume);
      setNotice(data.scoreWarning || `Extracted text from ${data.resume.originalName}. Match scores were refreshed for saved jobs.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function useSample() {
    setBusy('sample');
    setError('');
    setNotice('');
    try {
      const data = await ResumeApi.useSample();
      setResume(data.resume);
      setNotice(data.scoreWarning || 'Sample data engineer resume loaded. Saved jobs were scored against it.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      await ResumeApi.remove();
      setResume(null);
      setNotice('Resume removed. Job scores were cleared.');
      setConfirm(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function resetTailoring() {
    setBusy('reset');
    try {
      const data = await ResumeApi.resetTailoring();
      setResume(data.resume);
      setNotice(data.scoreWarning || 'Working resume reset to the original PDF text, and matches were re-run.');
      setConfirm(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Resume"
        title="The text matching actually uses"
        subtitle="Upload a text-based PDF. Scanned images cannot be read. Replacing the file re-scores every saved job."
      />
      <Disclaimer />
      <ErrorBanner message={error} onRetry={refresh} />
      {notice && <div className="banner banner-ok" role="status">{notice}</div>}
      {loading && <LoadingState label="Loading resume…" />}
      {!loading && !resume && (
        <div
          className={drag ? 'dropzone drag' : 'dropzone'}
          onDragOver={(event) => { event.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrag(false);
            const file = event.dataTransfer.files?.[0];
            if (file) send(file);
          }}
        >
          <p className="eyebrow">PDF only · 5 MB max</p>
          <h2>Drop your resume here</h2>
          <p className="subtitle">Or choose a file. JobMatch extracts the text, then lists the skills and roles it can see.</p>
          <div className="page-actions" style={{ justifyContent: 'center' }}>
            <button className="btn" type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
              {busy === 'upload' ? 'Extracting text…' : 'Choose PDF'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={useSample} disabled={Boolean(busy)}>
              {busy === 'sample' ? 'Loading sample…' : 'Use sample resume'}
            </button>
            <a className="btn btn-ghost" href={ResumeApi.samplePdfUrl} target="_blank" rel="noreferrer">Preview sample PDF</a>
          </div>
          <input ref={inputRef} className="file-input" type="file" accept="application/pdf,.pdf" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) send(file);
            event.target.value = '';
          }} />
        </div>
      )}
      {!loading && resume && (
        <div className="resume-layout">
          <aside className="resume-card">
            <p className="eyebrow">On file</p>
            <h2>{resume.originalName}</h2>
            <p className="form-hint">Uploaded {formatDate(resume.createdAt)}</p>
            <div style={{ height: 12 }} />
            <SkillChips label="Detected skills" items={(resume.skills || []).map((skill) => skill.name)} />
            <div style={{ height: 14 }} />
            <div className="page-actions">
              <button className="btn btn-small" type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
                {busy === 'upload' ? 'Replacing…' : 'Replace resume'}
              </button>
              <button className="btn btn-small btn-secondary" type="button" onClick={useSample} disabled={Boolean(busy)}>Use sample</button>
              {resume.hasTailoring && (
                <button className="btn btn-small btn-ghost" type="button" onClick={() => setConfirm('reset')} disabled={Boolean(busy)}>
                  Reset to PDF text
                </button>
              )}
              <button className="btn btn-small btn-danger" type="button" onClick={() => setConfirm('delete')} disabled={Boolean(busy)}>Remove</button>
            </div>
            <input ref={inputRef} className="file-input" type="file" accept="application/pdf,.pdf" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) send(file);
              event.target.value = '';
            }} />
          </aside>
          <div className="resume-card">
            <h2>Detected experience</h2>
            {resume.experience?.length ? (
              <div className="timeline">
                {resume.experience.map((role) => (
                  <article className="role" key={`${role.headline}-${role.dates}`}>
                    <h3>{role.headline}</h3>
                    <p className="muted">{role.dates}</p>
                    {role.highlights?.length > 0 && (
                      <ul>
                        {role.highlights.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 8 }}>No role history detected. The PDF text is still used for matching.</p>
            )}
            <h2 style={{ marginTop: 18 }}>Extracted text</h2>
            <pre className="text-panel">{resume.extractedText}</pre>
            {resume.hasTailoring && (
              <>
                <h2 style={{ marginTop: 18 }}>Working resume used for matching</h2>
                <p className="form-hint">Accepted improvements are appended here. The original PDF text stays above.</p>
                <pre className="text-panel">{resume.workingText}</pre>
              </>
            )}
          </div>
        </div>
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="Remove this resume?"
          body="Saved jobs stay, but their match scores are cleared until you upload again."
          confirmLabel="Remove resume"
          busy={busy === 'delete'}
          onConfirm={remove}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'reset' && (
        <ConfirmDialog
          title="Reset to the original PDF text?"
          body="Accepted wording is removed and every job is scored again from the extracted PDF."
          confirmLabel="Reset text"
          busy={busy === 'reset'}
          onConfirm={resetTailoring}
          onClose={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
