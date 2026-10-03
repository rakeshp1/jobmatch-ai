function categoryForScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'unscored';
  if (score >= 90) return 'ready';
  if (score >= 70) return 'optimize';
  return 'gap';
}

function categoryLabel(category) {
  switch (category) {
    case 'ready':
      return 'Ready to Apply';
    case 'optimize':
      return 'Resume Optimization Recommended';
    case 'gap':
      return 'Significant Skill Gap';
    default:
      return 'Not analyzed';
  }
}

function statusForScore(score, currentStatus) {
  if (currentStatus === 'applied') return 'applied';
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'saved';
  if (score >= 90) return 'ready_to_apply';
  if (score >= 70) return 'needs_improvement';
  return 'saved';
}

function statusLabel(status) {
  switch (status) {
    case 'needs_improvement':
      return 'Needs Improvement';
    case 'ready_to_apply':
      return 'Ready to Apply';
    case 'applied':
      return 'Applied';
    default:
      return 'Saved';
  }
}

module.exports = {
  categoryForScore,
  categoryLabel,
  statusForScore,
  statusLabel,
};
