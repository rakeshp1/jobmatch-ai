import { categoryOf } from '../utils/format';

export function ScoreRing({ score }) {
  const band = categoryOf(score);
  const value = score == null ? 0 : score;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="ring" aria-label={score == null ? 'Not scored' : `Match score ${score} percent`}>
      <svg viewBox="0 0 112 112">
        <circle className="ring-track" cx="56" cy="56" r={radius} />
        <circle className={`ring-value ring-${band}`} cx="56" cy="56" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="ring-label">{score == null ? '—' : `${score}%`}</div>
    </div>
  );
}
