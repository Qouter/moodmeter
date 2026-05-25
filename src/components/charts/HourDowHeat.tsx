import { Fragment } from 'react';
import type { Entry } from '../../lib/data';

interface HourDowHeatProps {
  entries: Entry[];
}

export function HourDowHeat({ entries }: HourDowHeatProps) {
  const dows = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const grid: Record<string, { sum: number; n: number }> = {};
  for (const e of entries) {
    const d = new Date(e.t);
    let dow = d.getDay() - 1;
    if (dow < 0) dow = 6;
    const h = d.getHours();
    if (h < 7 || h > 20) continue;
    const key = `${dow},${h}`;
    if (!grid[key]) grid[key] = { sum: 0, n: 0 };
    grid[key].sum += e.x - 4.5;
    grid[key].n += 1;
  }

  const cellSize = 17;
  const gap = 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `22px repeat(${hours.length}, ${cellSize}px)`, gap }}>
        <div />
        {hours.map((h) => (
          <div key={h} className="mono" style={{ fontSize: 9.5, color: 'var(--ink-mute)', textAlign: 'center' }}>
            {h}
          </div>
        ))}
        {dows.map((d, di) => (
          <Fragment key={d}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--ink-mute)',
                alignSelf: 'center',
                textTransform: 'uppercase',
              }}
            >
              {d}
            </div>
            {hours.map((h) => {
              const g = grid[`${di},${h}`];
              const v = g ? g.sum / g.n : null;
              const t = v == null ? 0 : Math.max(-1, Math.min(1, v / 4.5));
              const bg =
                v == null
                  ? 'rgba(40,55,90,0.05)'
                  : t >= 0
                    ? `rgba(92, 184, 114, ${0.18 + t * 0.65})`
                    : `rgba(232, 90, 79, ${0.18 + Math.abs(t) * 0.65})`;
              return (
                <div
                  key={h}
                  title={v != null && g ? `${v.toFixed(1)} · ${g.n} entradas` : 'sin datos'}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 5,
                    background: bg,
                    boxShadow: g ? 'inset 0 0 0 1px rgba(255,255,255,.55)' : 'none',
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
