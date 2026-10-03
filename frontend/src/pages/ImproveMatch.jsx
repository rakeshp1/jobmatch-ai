import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Disclaimer, ErrorBanner, LoadingState, PageHeader } from '../components/Feedback';
import { SkillChips } from '../components/SkillChips';
import { JobsApi, errorMessage } from '../services/api';
import { CATEGORY_LABEL } from '../utils/format';

export function ImproveMatch() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState('');
  const [rerun, setRerun] = useState(null);

  async function load() {
    setError('');
    try {
      const data = await JobsApi.improve(id);
      setPlan(data.plan);
    } catch (err) {
      setError(errorMessage(err));
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Improve match · JobMatch AI';
    load();
  }, [id]);

  const chosen = Object.keys(selected).filter((key) => selected[key]);

  async function accept() {
    setBusy('accept');
    setNotice('');
    setError('');
    try {
      const result = await JobsApi.accept(id, chosen);
      setPlan(result.plan);
      setSelected({});
      setNotice(result.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function rerunAnalysis() {
    setBusy('score');
    setNotice('');
    setError('');
    const previous = plan?.matchScore;
    try {
      const result = await JobsApi.analyze(id);
      setRerun({ ...result, remembered: previous });
      await load();
      setNotice(result.becameReady
        ? `Updated match is ${result.job.matchScore}%. This job moved to Ready to Apply.`
        : `Updated match is ${result.job.matchScore}%.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Improve match"
        title={plan ? `${plan.title} at ${plan.company}` : 'Improve match'}
        subtitle="Compare the current wording with recommended lines. Accepting adds them to the working resume. Re-run the match to refresh the percentage."
        actions={plan && (
          <>
            <Link className="btn btn-ghost" to={`/jobs/${plan.jobId}`}>View analysis</Link>
            <button className="btn btn-secondary" type="button" onClick={rerunAnalysis} disabled={Boolean(busy)}>
              {busy === 'score' ? 'Scoring…' : 'Re-run match analysis'}
            </button>
          </>
        )}
      />
      <Disclaimer />
      {notice && <div className="banner banner-ok" role="status">{notice}</div>}
      {rerun?.becameReady && (
        <div className="banner banner-ok">
          <span>90% or above. This role is in Ready to Apply.</span>
          <Link className="btn btn-small" to="/applications?status=ready_to_apply">Open applications</Link>
        </div>
      )}
      <ErrorBanner message={error} onRetry={load} />
      {loading && <LoadingState label="Preparing suggestions…" />}
      {!loading && error && (
        <button className="btn" type="button" onClick={rerunAnalysis} disabled={Boolean(busy)}>Run match analysis</button>
      )}
      {plan && (
        <div className="panel">
          <div className="section-head">
            <h2>Last match: {plan.matchScore}%</h2>
            <span className={`badge badge-${plan.category}`}>{CATEGORY_LABEL[plan.category] || plan.categoryLabel}</span>
          </div>
          {plan.scoreStale && <p className="form-hint">Accepted wording is in the working resume, but this percentage is from the last run.</p>}
          {rerun?.remembered != null && rerun.job && (
            <p style={{ margin: '8px 0 12px' }}>Match moved from {rerun.remembered}% to {rerun.job.matchScore}%.</p>
          )}
          <div className="detail-grid">
            <SkillChips label="Missing keywords" items={plan.missingKeywords} tone="miss" />
            <SkillChips label="Skills to emphasize" items={plan.skillsToEmphasize} />
          </div>
          <h3 style={{ marginTop: 18 }}>Current resume wording</h3>
          <div className="detail-grid">
            {plan.excerpts.map((excerpt) => (
              <div className="wording" key={excerpt.id}>
                <h3>{excerpt.label}</h3>
                <p>{excerpt.text}</p>
              </div>
            ))}
          </div>
          <div className="form-row" style={{ marginTop: 18 }}>
            <h3>Recommendations</h3>
            <button className="btn btn-small" type="button" onClick={accept} disabled={!chosen.length || Boolean(busy)}>
              {busy === 'accept' ? 'Saving…' : `Accept selected (${chosen.length})`}
            </button>
          </div>
          {plan.recommendations.length === 0 && (
            <p className="muted" style={{ marginTop: 10 }}>No further suggestions from the current text. Re-run the match, or edit the resume, if the score is still short of 90%.</p>
          )}
          {plan.recommendations.map((rec) => (
            <article className="rec-card" key={rec.id}>
              <label className="rec-head">
                <input
                  type="checkbox"
                  checked={Boolean(selected[rec.id])}
                  onChange={(event) => setSelected((current) => ({ ...current, [rec.id]: event.target.checked }))}
                />
                <span>
                  <strong>{rec.title}</strong>
                </span>
              </label>
              <div className="compare">
                <div className="wording">
                  <h3>Current resume wording</h3>
                  <p>{rec.currentWording}</p>
                </div>
                <div className="wording wording-new">
                  <h3>AI-recommended improved wording</h3>
                  <p>{rec.improvedWording}</p>
                  <h3 style={{ marginTop: 10 }}>Suggested bullet</h3>
                  <p>• {rec.suggestedBullet}</p>
                </div>
              </div>
              <div className="detail-grid">
                <SkillChips label="Missing keywords" items={rec.missingKeywords} tone="miss" />
                <SkillChips label="Skills to emphasize" items={rec.skillsToEmphasize} />
              </div>
            </article>
          ))}
          {plan.accepted?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Already added to the working resume</h3>
              <ul className="plain-list">
                {plan.accepted.map((item) => <li key={item.id}>{item.wording}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
