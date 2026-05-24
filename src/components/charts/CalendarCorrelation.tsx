import { MOCK_CALENDAR, type CalendarEvent, type Entry } from '../../lib/data';
import { MoodPill } from './MoodPill';

interface CalendarCorrelationProps {
  entries: Entry[];
}

export function CalendarCorrelation({ entries }: CalendarCorrelationProps) {
  const rows = MOCK_CALENDAR.map((ev: CalendarEvent) => {
    const samples = entries.filter((e) => {
      const d = new Date(e.t);
      return Math.abs(d.getHours() - ev.hour) <= 1;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 110px',
            gap: 14,
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 14,
            background: 'var(--bg)',
            boxShadow: 'var(--neu-out-xs)',
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
            {String(r.hour).padStart(2, '0')}:00
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: kindColor[r.kind] }} />
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
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              ×{r.n}
            </span>
          </div>
          <MoodPill p={r.avgP} e={r.avgE} />
        </div>
      ))}
    </div>
  );
}
