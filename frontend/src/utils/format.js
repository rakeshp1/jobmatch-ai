export function categoryOf(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'unscored';
  if (score >= 90) return 'ready';
  if (score >= 70) return 'optimize';
  return 'gap';
}

export const CATEGORY_LABEL = {
  ready: 'Ready to Apply',
  optimize: 'Resume Optimization Recommended',
  gap: 'Significant Skill Gap',
  unscored: 'Not analyzed',
};

export const STATUS_LABEL = {
  saved: 'Saved',
  needs_improvement: 'Needs Improvement',
  ready_to_apply: 'Ready to Apply',
  applied: 'Applied',
};

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initials(company) {
  const parts = String(company || '').trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`;
  return letters.toUpperCase() || 'JB';
}

export function scoreLabel(score) {
  if (score === null || score === undefined) return 'Not scored';
  return `${score}% match`;
}
