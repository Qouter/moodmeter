import type { Quadrant } from '../../lib/data';

interface QuadrantDonutProps {
  counts: Partial<Record<Quadrant, number>>;
  size?: number;
}

function labelQ(q: Quadrant): string {
  return {
    'high-pleasant': 'Alta energía · Agradable',
    'high-unpleasant': 'Alta energía · Desagradable',
    'low-unpleasant': 'Baja energía · Desagradable',
    'low-pleasant': 'Baja energía · Agradable',
  }[q];
}

export function QuadrantDonut({ counts, size = 180 }: QuadrantDonutProps) {
  const total = Object.values(counts).reduce<number>((a, b) => a + (b ?? 0), 0) || 1;
  const order: Quadrant[] = ['high-pleasant', 'high-unpleasant', 'low-unpleasant', 'low-pleasant'];
  const colors: Record<Quadrant, string> = {
    'high-pleasant': '#e7b733',
    'high-unpleasant': '#e85a4f',
    'low-unpleasant': '#4a76c6',
    'low-pleasant': '#5cb872',
  };

  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 14,
    stroke = 22;
  let acc = 0;
  const arcs = order.map((q) => {
    const v = counts[q] || 0;
    const frac = v / total;
    const dash = frac * (2 * Math.PI * r);
    const gap = 2 * Math.PI * r - dash;
    const rot = (acc / total) * 360 - 90;
    acc += v;
    return { q, frac, dash, gap, rot, color: colors[q] };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--shadow-dark)" strokeOpacity="0.25" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${a.gap}`}
            transform={`rotate(${a.rot} ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 4} fontSize="26" fontWeight="700" textAnchor="middle" fontFamily="Plus Jakarta Sans" fill="var(--ink)">
          {total}
        </text>
        <text x={cx} y={cy + 14} fontSize="10" textAnchor="middle" fill="var(--ink-mute)" letterSpacing="1" fontWeight="600">
          CHECK-INS
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
        {arcs.map((a) => (
          <div key={a.q} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: a.color, boxShadow: '0 2px 4px rgba(40,55,90,.18)' }} />
            <span style={{ color: 'var(--ink-soft)', minWidth: 180, fontWeight: 500, whiteSpace: 'nowrap' }}>{labelQ(a.q)}</span>
            <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>
              {Math.round(a.frac * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
