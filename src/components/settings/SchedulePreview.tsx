import { ChatMock } from './ChatMock';

function hToStr(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

type ScheduleMode = 'random' | 'fixed' | 'manual';

interface SchedulePreviewProps {
  schedule: number[];
  nextIdx: number;
  mode: ScheduleMode;
  isWeekend: boolean;
  weekendMode: 'same' | 'reduced' | 'off';
  effectivePings: number;
  pingsPerDay: number;
}

export function SchedulePreview({
  schedule,
  nextIdx,
  mode,
  isWeekend,
  weekendMode,
  effectivePings,
  pingsPerDay,
}: SchedulePreviewProps) {
  const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }} className="preview-2col">
      <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Hoy
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', textTransform: 'capitalize' }}>{todayStr}</div>
        </div>

        {mode === 'manual' ? (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, padding: '12px 0' }}>
            No habrá recordatorios automáticos. Escribe <span className="mono" style={{ color: 'var(--ink)' }}>/mood</span> cuando quieras registrar.
          </div>
        ) : schedule.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, padding: '12px 0' }}>
            Hoy es {isWeekend ? 'fin de semana' : 'día laboral'} y los recordatorios están <strong>desactivados</strong>.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {schedule.map((h, i) => {
                const isPast = i < nextIdx || nextIdx === -1;
                const isNext = i === nextIdx;
                return (
                  <span
                    key={i}
                    className="mono"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: 700,
                      background: 'var(--bg)',
                      boxShadow: isNext
                        ? '0 4px 12px rgba(108,127,255,.35), inset 0 0 0 1.5px var(--accent)'
                        : isPast
                          ? 'var(--neu-in)'
                          : 'var(--neu-out-xs)',
                      color: isNext ? 'var(--accent)' : isPast ? 'var(--ink-faint)' : 'var(--ink)',
                      textDecoration: isPast ? 'line-through' : 'none',
                    }}
                  >
                    {hToStr(h)}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 12, lineHeight: 1.5 }}>
              {effectivePings} ping{effectivePings === 1 ? '' : 's'}
              {isWeekend && weekendMode === 'reduced' && effectivePings < pingsPerDay && <span> · reducido por fin de semana</span>}
              {mode === 'random' && <span> · horas regeneradas cada día</span>}
              {mode === 'fixed' && <span> · mismas horas a diario</span>}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Vista previa del mensaje
          </div>
        </div>
        <ChatMock />
      </div>

      <style>{`
        @media (max-width: 720px) {
          .preview-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
