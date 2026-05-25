import { useState, useMemo, useRef, useEffect } from 'react';
import { MoodGrid } from '../components/MoodGrid';
import { NeuCard, NeuButton, BottomSheet } from '../components/primitives';
import { Icon } from '../components/icons';
import { cellColor, displayCoord, MOOD_LABELS, quadrant, quadrantMeta, type Entry } from '../lib/data';
import { formatDate, formatTime, timeOfDayGreeting } from '../lib/format';

interface CheckInScreenProps {
  entries: Entry[];
  onAdd: (e: Entry) => void;
}

export function CheckInScreen({ entries, onAdd }: CheckInScreenProps) {
  const [selected, setSelected] = useState<{ x: number; y: number; label: string } | null>(null);
  const [word, setWord] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelect = (cell: { x: number; y: number; label: string }) => {
    setSelected(cell);
    setWord('');
    setSheetOpen(true);
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  const onSave = () => {
    if (!selected) return;
    const entry: Entry = {
      id: Math.random().toString(36).slice(2, 10),
      t: new Date().toISOString(),
      x: selected.x,
      y: selected.y,
      word: word.trim(),
      label: MOOD_LABELS[9 - selected.y][selected.x],
    };
    onAdd(entry);
    setSheetOpen(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1900);
    setSelected(null);
    setWord('');
  };

  const q = selected ? quadrant(selected.x, selected.y) : null;
  const qm = q ? quadrantMeta(q) : null;
  const coord = selected ? displayCoord(selected.x, selected.y) : null;

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return entries.filter((e) => new Date(e.t) >= t).length;
  }, [entries]);

  // Keep a tick clock to refresh the time display each minute.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
        <div style={{ minWidth: 0, flex: '1 1 200px' }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-mute)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {timeOfDayGreeting()}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink-mute)' }}>
            {formatDate(now)} · <span className="mono">{formatTime(now)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <NeuCard inset style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 72 }}>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>
              {today}
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--ink-mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              hoy
            </span>
          </NeuCard>
          <NeuCard inset style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 72 }}>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>
              {entries.length}
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--ink-mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              total
            </span>
          </NeuCard>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 320px)',
          gap: 22,
          alignItems: 'start',
        }}
        className="checkin-grid"
      >
        <NeuCard style={{ padding: 26 }}>
          <MoodGrid selected={selected} onSelect={onSelect} />
        </NeuCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <NeuCard style={{ padding: 22 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--ink-mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 12,
              }}
            >
              Próxima notificación
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  boxShadow: 'var(--neu-in)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Icon.Bell />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
                  en 1h 47m
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>vía Telegram · @moodmeter_bot</div>
              </div>
            </div>
          </NeuCard>
        </div>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {selected && qm && coord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: cellColor(selected.x, selected.y),
                  boxShadow: '0 8px 18px rgba(40,55,90,.18), inset 0 0 0 2px rgba(255,255,255,.7)',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>¿Cómo lo nombrarías?</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: qm.dot }} />
                  {qm.name}
                  <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ink-faint)' }}>
                    P {coord.pleasantness >= 0 ? '+' : ''}
                    {coord.pleasantness} · E {coord.energy >= 0 ? '+' : ''}
                    {coord.energy}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  boxShadow: 'var(--neu-out-sm)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--ink-soft)',
                }}
                aria-label="cerrar"
              >
                <Icon.Close />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Una palabra
              </label>
              <div
                style={{
                  marginTop: 8,
                  background: 'var(--bg)',
                  borderRadius: 16,
                  boxShadow: 'var(--neu-in)',
                  padding: '4px 8px',
                }}
              >
                <input
                  ref={inputRef}
                  value={word}
                  onChange={(e) => setWord(e.target.value.slice(0, 32))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSave();
                  }}
                  placeholder=""
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 12px',
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <NeuButton onClick={() => setSheetOpen(false)} style={{ flex: 1 }}>
                Volver
              </NeuButton>
              <NeuButton
                variant="primary"
                onClick={onSave}
                disabled={!word.trim()}
                style={{ flex: 1.5 }}
                leadingIcon={<Icon.Check />}
              >
                Guardar
              </NeuButton>
            </div>
          </div>
        )}
      </BottomSheet>

      {savedFlash && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: 'calc(env(safe-area-inset-top, 0px) + 28px)',
            transform: 'translateX(-50%)',
            background: 'var(--bg)',
            borderRadius: 999,
            boxShadow: '0 12px 30px rgba(40,55,90,.22), var(--neu-out)',
            padding: '12px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            color: 'var(--ink)',
            animation: 'pop .4s cubic-bezier(.2,.8,.2,1)',
            zIndex: 100,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(145deg,#7286ff,#5c70ee)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon.Check />
          </span>
          Guardado · sincronizado con Supabase
        </div>
      )}

      <style>{`
        @media (max-width: 880px) {
          .checkin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
