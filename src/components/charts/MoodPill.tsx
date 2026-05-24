interface MoodPillProps {
  p: number;
  e: number;
}
export function MoodPill({ p, e }: MoodPillProps) {
  const ratioP = (p + 5) / 10;
  const ratioE = (e + 5) / 10;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'var(--bg)',
        boxShadow: 'var(--neu-in)',
        fontSize: 11,
        fontFamily: 'JetBrains Mono',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#2e8b48', opacity: 0.4 + ratioP * 0.6 }} />
        <span style={{ color: 'var(--ink-soft)' }}>
          {p >= 0 ? '+' : ''}
          {p.toFixed(1)}
        </span>
      </span>
      <span style={{ color: 'var(--ink-faint)' }}>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#e85a4f', opacity: 0.4 + ratioE * 0.6 }} />
        <span style={{ color: 'var(--ink-soft)' }}>
          {e >= 0 ? '+' : ''}
          {e.toFixed(1)}
        </span>
      </span>
    </div>
  );
}
