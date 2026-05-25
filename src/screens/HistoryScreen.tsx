import { useMemo } from 'react';
import { NeuCard } from '../components/primitives';
import { MoodPill } from '../components/charts/MoodPill';
import { Icon } from '../components/icons';
import { cellColor, type Entry } from '../lib/data';
import { formatDate, formatTime } from '../lib/format';

interface HistoryScreenProps {
  entries: Entry[];
  onDelete: (id: string) => void;
}

export function HistoryScreen({ entries, onDelete }: HistoryScreenProps) {
  const groups = useMemo(() => {
    const byDay: Record<string, { date: Date; items: Entry[] }> = {};
    for (const e of entries) {
      const d = new Date(e.t);
      d.setHours(0, 0, 0, 0);
      const k = d.toISOString();
      if (!byDay[k]) byDay[k] = { date: d, items: [] };
      byDay[k].items.push(e);
    }
    return Object.values(byDay)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => new Date(b.t).getTime() - new Date(a.t).getTime()),
      }));
  }, [entries]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Historial
        </h1>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>{entries.length} entradas guardadas</div>
      </div>

      {groups.length === 0 && (
        <NeuCard>
          <div style={{ color: 'var(--ink-mute)', textAlign: 'center', padding: 20 }}>Aún sin entradas. Haz un registro para empezar.</div>
        </NeuCard>
      )}

      {groups.map((g) => {
        const avgP = g.items.reduce((a, b) => a + (b.x - 4.5), 0) / g.items.length;
        const avgE = g.items.reduce((a, b) => a + (b.y - 4.5), 0) / g.items.length;
        return (
          <NeuCard key={g.date.toISOString()} style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{formatDate(g.date)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                  {g.items.length} registro{g.items.length === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <MoodPill p={avgP} e={avgE} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.items.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr auto auto',
                    gap: 14,
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'var(--bg)',
                    boxShadow: 'var(--neu-out-xs)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: cellColor(e.x, e.y),
                      boxShadow: '0 4px 10px rgba(40,55,90,.18), inset 0 0 0 1.5px rgba(255,255,255,.6)',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>
                      {e.word || '—'}
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'right' }}>
                    {formatTime(new Date(e.t))}
                  </div>
                  <button
                    onClick={() => onDelete(e.id)}
                    aria-label="eliminar"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--bg)',
                      boxShadow: 'var(--neu-out-xs)',
                      color: 'var(--ink-mute)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon.Close />
                  </button>
                </div>
              ))}
            </div>
          </NeuCard>
        );
      })}
    </div>
  );
}
