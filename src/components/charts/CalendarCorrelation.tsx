import { type CalendarEvent, type Entry } from '../../lib/data';
import { MoodPill } from './MoodPill';

interface CalendarCorrelationProps {
  entries: Entry[];
  events: CalendarEvent[];
}

function hourLabel(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function CalendarCorrelation({ entries, events }: CalendarCorrelationProps) {
  const rows = events.map((ev: CalendarEvent) => {
    const samples = entries.filter((e) => {
      const d = new Date(e.t);
      const eH = d.getHours() + d.getMinutes() / 60;
      return Math.abs(eH - ev.hour) <= 1;
    });
    const n = samples.length;
    const avgP = n ? samples.reduce((a, b) => a + (b.x - 4.5), 0) / n : 0;
    const avgE = n ? samples.reduce((a, b) => a + (b.y - 4.5), 0) / n : 0;
    return { ...ev, n, avgP, avgE };
  });

  const kindColor: Record<CalendarEvent['kind'], string> = {
    work: '#6c7fff',
    focus: '#2e8b48',
    personal: '#e0b13a',
    wellness: '#4a76c6',
  };

  if (events.length === 0) {
    return (
      <div style={{ fontSize: 13, color: 'var(--ink-mute)', textAlign: 'center', padding: 24 }}>
        No hay eventos en tu Google Calendar para hoy.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '52px 1fr 110px',
            gap: 14,
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 14,
            background: 'var(--bg)',
            boxShadow: 'var(--neu-out-xs)',
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
            {hourLabel(r.hour)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: kindColor[r.kind], flexShrink: 0 }} />
            <span
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.title}
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>
              ×{r.n}
            </span>
          </div>
          <MoodPill p={r.avgP} e={r.avgE} />
        </div>
      ))}
    </div>
  );
}
