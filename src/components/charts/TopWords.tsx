import type { Entry } from '../../lib/data';

interface TopWordsProps {
  entries: Entry[];
  limit?: number;
}

export function TopWords({ entries, limit = 8 }: TopWordsProps) {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const w = (e.word || '').trim().toLowerCase();
    if (!w) continue;
    counts[w] = (counts[w] || 0) + 1;
  }
  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const max = items[0]?.[1] || 1;
  if (!items.length) return <div style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Sin palabras todavía</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(([w, c]) => (
        <div key={w} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 36px', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{w}</div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: 'var(--bg)',
              boxShadow: 'var(--neu-in)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${(c / max) * 100}%`,
                background: 'linear-gradient(90deg, #aeb8ff, #6c7fff)',
                borderRadius: 999,
                boxShadow: '0 1px 3px rgba(80,100,200,.4)',
              }}
            />
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'right' }}>
            ×{c}
          </div>
        </div>
      ))}
    </div>
  );
}
