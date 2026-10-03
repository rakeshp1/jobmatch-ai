export function SkillChips({ label, items, tone = 'match' }) {
  return (
    <div>
      {label && <div className="skill-label">{label}</div>}
      {items?.length ? (
        <div className="chip-row">
          {items.map((item) => (
            <span key={item} className={tone === 'miss' ? 'chip chip-miss' : 'chip'}>{item}</span>
          ))}
        </div>
      ) : (
        <p className="muted">None detected.</p>
      )}
    </div>
  );
}
