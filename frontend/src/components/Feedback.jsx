export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="banner banner-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-small btn-secondary" type="button" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, body, children }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {children}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="disclaimer">
      Match scores estimate how closely your resume wording overlaps a job description. They are not a guarantee of qualification or an interview.
    </p>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
