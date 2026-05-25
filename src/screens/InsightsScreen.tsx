import { useEffect, useMemo, useState } from 'react';
import { NeuCard, NeuButton, Stat } from '../components/primitives';
import { MoodGrid } from '../components/MoodGrid';
import { LineChart } from '../components/charts/LineChart';
import { QuadrantDonut } from '../components/charts/QuadrantDonut';
import { HourDowHeat } from '../components/charts/HourDowHeat';
import { TopWords } from '../components/charts/TopWords';
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

  const filtered = useMemo(() => {
    const days = parseInt(range, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    cutoff.setHours(0, 0, 0, 0);
    return entries.filter((e) => new Date(e.t) >= cutoff);
  }, [entries, range]);

  const dailyData = useMemo(() => {
    const days = parseInt(range, 10);
    const buckets: Record<string, { date: Date; sumP: number; sumE: number; n: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      buckets[d.toDateString()] = { date: d, sumP: 0, sumE: 0, n: 0 };
    }
    for (const e of filtered) {
      const key = new Date(e.t);
      key.setHours(0, 0, 0, 0);
      const k = key.toDateString();
      if (buckets[k]) {
        buckets[k].sumP += e.x - 4.5;
        buckets[k].sumE += e.y - 4.5;
        buckets[k].n += 1;
      }
    }
    return Object.values(buckets).map((b) => ({
      date: b.date,
      label: b.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      pleasantness: b.n ? b.sumP / b.n : 0,
      energy: b.n ? b.sumE / b.n : 0,
    }));
  }, [filtered, range]);

  const counts = useMemo(() => {
    const c: Partial<Record<Quadrant, number>> = {};
    for (const e of filtered) {
      const q = quadrant(e.x, e.y);
      c[q] = (c[q] || 0) + 1;
    }
    return c;
  }, [filtered]);

  const heat = useMemo(() => {
    const h: Record<string, number> = {};
    for (const e of filtered) h[`${e.x},${e.y}`] = (h[`${e.x},${e.y}`] || 0) + 1;
    return h;
  }, [filtered]);

  const avgP = filtered.length ? filtered.reduce((a, b) => a + (b.x - 4.5), 0) / filtered.length : 0;
  const avgE = filtered.length ? filtered.reduce((a, b) => a + (b.y - 4.5), 0) / filtered.length : 0;

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <NeuCard>
          <Stat label="Placer medio" value={`${avgP >= 0 ? '+' : ''}${avgP.toFixed(1)}`} sublabel="-5 a +5" accent="#2e8b48" />
        </NeuCard>
        <NeuCard>
          <Stat label="Energía media" value={`${avgE >= 0 ? '+' : ''}${avgE.toFixed(1)}`} sublabel="-5 a +5" accent="#e85a4f" />
        </NeuCard>
        <NeuCard>
          <Stat label="Registros" value={filtered.length} sublabel={`en ${range} días`} />
        </NeuCard>
        <NeuCard>
          <Stat label="Racha" value={`${streak}d`} sublabel="días consecutivos" accent="var(--accent)" />
        </NeuCard>
      </div>

      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Tu estado en el tiempo</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Media diaria de placer y energía</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-soft)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 3, borderRadius: 2, background: '#2e8b48' }} /> Placer
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 3, borderRadius: 2, background: '#e85a4f' }} /> Energía
            </span>
          </div>
        </div>
        <LineChart data={dailyData} />
      </NeuCard>

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

      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}
        className="insight-2col"
      >
        <NeuCard style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Mapa de calor</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 18 }}>Frecuencia por celda</div>
          <MoodGrid heatmap={heat} />
        </NeuCard>

        <NeuCard style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Palabras más usadas</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 18 }}>Tu vocabulario emocional</div>
          <TopWords entries={filtered} />
        </NeuCard>
      </div>

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
