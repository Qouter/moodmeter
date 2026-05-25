import { useEffect, useMemo, useRef, useState } from 'react';
import { NeuCard, NeuButton, Stat } from '../components/primitives';
import { MoodGrid } from '../components/MoodGrid';
import { QuadrantDonut } from '../components/charts/QuadrantDonut';
import { HourDowHeat } from '../components/charts/HourDowHeat';
import { CalendarCorrelation } from '../components/charts/CalendarCorrelation';
import { quadrant, type CalendarEvent, type Entry, type Quadrant } from '../lib/data';
import { fetchCalendarEventsForDay, CalendarAuthError } from '../lib/calendar';
import { useAuth } from '../lib/auth';

interface InsightsScreenProps {
  entries: Entry[];
}

type Range = '7' | '14' | '30';

export function InsightsScreen({ entries }: InsightsScreenProps) {
  const [range, setRange] = useState<Range>('7');
  const { session, signInWithGoogle } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[] | null>(null);
  const [calendarState, setCalendarState] = useState<'loading' | 'ready' | 'needs-auth' | 'error'>('loading');
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const providerToken = session?.provider_token ?? null;

  useEffect(() => {
    let cancelled = false;
    setCalendarState('loading');
    fetchCalendarEventsForDay(new Date())
      .then((evs) => {
        if (cancelled) return;
        setCalendarEvents(evs);
        setCalendarState('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof CalendarAuthError) {
          setCalendarState('needs-auth');
        } else {
          setCalendarError(e instanceof Error ? e.message : 'Error desconocido');
          setCalendarState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [providerToken]);

  const days = parseInt(range, 10);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    cutoff.setHours(0, 0, 0, 0);
    return entries.filter((e) => new Date(e.t) >= cutoff);
  }, [entries, days]);

  const counts = useMemo(() => {
    const c: Partial<Record<Quadrant, number>> = {};
    for (const e of filtered) {
      const q = quadrant(e.x, e.y);
      c[q] = (c[q] || 0) + 1;
    }
    return c;
  }, [filtered]);

  const [heatDayIdx, setHeatDayIdx] = useState(days - 1);
  const [heatPlaying, setHeatPlaying] = useState(false);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHeatDayIdx(days - 1);
    setHeatPlaying(false);
  }, [days]);

  useEffect(() => {
    if (!heatPlaying) {
      if (playTimer.current) clearInterval(playTimer.current);
      playTimer.current = null;
      return;
    }
    playTimer.current = setInterval(() => {
      setHeatDayIdx((i) => {
        if (i >= days - 1) {
          setHeatPlaying(false);
          return days - 1;
        }
        return i + 1;
      });
    }, 450);
    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [heatPlaying, days]);

  const cursorDate = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    d.setDate(d.getDate() - (days - 1 - heatDayIdx));
    return d;
  }, [days, heatDayIdx]);

  const heat = useMemo(() => {
    const h: Record<string, number> = {};
    const cursorMs = cursorDate.getTime();
    for (const e of filtered) {
      if (new Date(e.t).getTime() > cursorMs) continue;
      h[`${e.x},${e.y}`] = (h[`${e.x},${e.y}`] || 0) + 1;
    }
    return h;
  }, [filtered, cursorDate]);

  const heatTotal = useMemo(() => Object.values(heat).reduce((a, b) => a + b, 0), [heat]);

  const togglePlay = () => {
    setHeatPlaying((p) => {
      if (!p && heatDayIdx >= days - 1) setHeatDayIdx(0);
      return !p;
    });
  };

  const streak = useMemo(() => {
    let s = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const has = entries.some((e) => {
        const ed = new Date(e.t);
        ed.setHours(0, 0, 0, 0);
        return ed.getTime() === d.getTime();
      });
      if (has) s++;
      else break;
    }
    return s;
  }, [entries]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Tu evolución
          </h1>
          <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>
            Cómo se mueve tu energía y placer en el tiempo
          </div>
        </div>
        <RangeSwitch value={range} onChange={setRange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <NeuCard>
          <Stat label="Registros" value={filtered.length} sublabel={`en ${range} días`} />
        </NeuCard>
        <NeuCard>
          <Stat label="Racha" value={`${streak}d`} sublabel="días consecutivos" accent="var(--accent)" />
        </NeuCard>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}
        className="insight-2col"
      >
        <NeuCard style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Reparto por cuadrante</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 18 }}>Dónde caes la mayoría del tiempo</div>
          <QuadrantDonut counts={counts} />
        </NeuCard>

        <NeuCard style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Patrón semanal</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 18 }}>Placer medio por hora y día</div>
          <div style={{ overflowX: 'auto' }}>
            <HourDowHeat entries={filtered} />
          </div>
        </NeuCard>
      </div>

      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Mapa de calor</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Cómo se llena tu mapa día a día</div>
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            {cursorDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            <span style={{ color: 'var(--ink-faint)' }}> · {heatTotal} registros</span>
          </div>
        </div>
        <MoodGrid heatmap={heat} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <button
            onClick={togglePlay}
            aria-label={heatPlaying ? 'Pausar' : 'Reproducir'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--bg)',
              boxShadow: heatPlaying ? 'var(--neu-in)' : 'var(--neu-out-sm)',
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-soft)',
              flexShrink: 0,
              transition: 'box-shadow .15s ease',
            }}
          >
            {heatPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="3" y="2" width="3" height="10" rx="1" />
                <rect x="8" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 2 L12 7 L3 12 Z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={days - 1}
            value={heatDayIdx}
            onChange={(e) => {
              setHeatPlaying(false);
              setHeatDayIdx(parseInt(e.target.value, 10));
            }}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
        </div>
      </NeuCard>

      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Cruzando con tu calendario</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Estado medio en torno a tus eventos de hoy</div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'var(--bg)',
              boxShadow: 'var(--neu-in)',
              fontSize: 12,
              color: 'var(--ink-soft)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: calendarState === 'ready' ? '#5cb872' : calendarState === 'loading' ? '#b8bfcc' : '#e85a4f',
              }}
            />
            {calendarState === 'ready' && 'Google Calendar conectado'}
            {calendarState === 'loading' && 'Cargando eventos…'}
            {calendarState === 'needs-auth' && 'Permiso de calendario requerido'}
            {calendarState === 'error' && 'Error al leer calendario'}
          </div>
        </div>

        {calendarState === 'ready' && calendarEvents && (
          <CalendarCorrelation entries={filtered} events={calendarEvents} />
        )}
        {calendarState === 'loading' && (
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', textAlign: 'center', padding: 24 }}>Cargando…</div>
        )}
        {calendarState === 'needs-auth' && (
          <div style={{ display: 'grid', gap: 12, padding: '12px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              Necesitamos permiso para leer los eventos de tu Google Calendar. Tu sesión actual no lo incluye o el token caducó.
            </div>
            <div>
              <NeuButton onClick={() => signInWithGoogle()}>Conectar Google Calendar</NeuButton>
            </div>
          </div>
        )}
        {calendarState === 'error' && (
          <div style={{ fontSize: 13, color: 'var(--q-red)', padding: 12 }}>{calendarError}</div>
        )}
      </NeuCard>

      <style>{`
        @media (max-width: 760px) {
          .insight-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

interface RangeSwitchProps {
  value: Range;
  onChange: (v: Range) => void;
}
function RangeSwitch({ value, onChange }: RangeSwitchProps) {
  const opts: { v: Range; l: string }[] = [
    { v: '7', l: '7d' },
    { v: '14', l: '14d' },
    { v: '30', l: '30d' },
  ];
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 5,
        borderRadius: 999,
        background: 'var(--bg)',
        boxShadow: 'var(--neu-in)',
        gap: 4,
      }}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            color: value === o.v ? 'var(--ink)' : 'var(--ink-mute)',
            background: value === o.v ? 'var(--bg)' : 'transparent',
            boxShadow: value === o.v ? 'var(--neu-out-sm)' : 'none',
            transition: 'all .2s ease',
          }}
          className="mono"
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
