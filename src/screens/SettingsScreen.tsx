import { useEffect, useMemo, useRef, useState } from 'react';
import { NeuCard, NeuButton } from '../components/primitives';
import { Icon } from '../components/icons';
import {
  Label,
  Segmented,
  SliderRow,
  TimeRange,
  Toggle,
  ToggleRow,
  MiniToggle,
  SettingRow,
} from '../components/settings/controls';
import { SchedulePreview } from '../components/settings/SchedulePreview';
import { computeSchedule } from '../lib/format';
import {
  loadSettings,
  saveSettings,
  generateLinkToken,
  TELEGRAM_BOT_USERNAME,
  type UserSettings,
} from '../lib/data';
import { useAuth } from '../lib/auth';

interface SettingsScreenProps {
  onClear: () => void;
  onSeed: () => void;
}

type Mode = UserSettings['mode'];
type WeekendMode = UserSettings['weekend_mode'];

function hToStr(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function SettingsScreen({ onClear, onSeed }: SettingsScreenProps) {
  const { session, signInWithGoogle } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<Partial<UserSettings>>({});

  useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((s) => {
        if (cancelled) return;
        if (!s.telegram_link_token) {
          const token = generateLinkToken();
          setSettings({ ...s, telegram_link_token: token });
          saveSettings({ telegram_link_token: token }).catch((e) =>
            console.error('No se pudo guardar el token de Telegram:', e),
          );
        } else {
          setSettings(s);
        }
      })
      .catch((e) => console.error('No se pudieron cargar los ajustes:', e));
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (patch: Partial<UserSettings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const toSave = pendingPatch.current;
      pendingPatch.current = {};
      saveSettings(toSave).catch((e) => console.error('No se pudieron guardar los ajustes:', e));
    }, 400);
  };

  const mode: Mode = settings?.mode ?? 'random';
  const pingsPerDay = settings?.pings_per_day ?? 4;
  const windowStart = settings?.window_start ?? 9;
  const windowEnd = settings?.window_end ?? 22;
  const weekendMode: WeekendMode = settings?.weekend_mode ?? 'reduced';

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const effectivePings = useMemo(() => {
    if (mode === 'manual') return 0;
    if (isWeekend && weekendMode === 'off') return 0;
    if (isWeekend && weekendMode === 'reduced') return Math.max(1, Math.ceil(pingsPerDay / 2));
    return pingsPerDay;
  }, [mode, isWeekend, weekendMode, pingsPerDay]);

  const dateSeed = today.getFullYear() * 1000 + today.getMonth() * 31 + today.getDate();
  const schedule = useMemo(
    () => computeSchedule({ mode, pingsPerDay: effectivePings, windowStart, windowEnd }, dateSeed),
    [mode, effectivePings, windowStart, windowEnd, dateSeed],
  );

  const nowH = today.getHours() + today.getMinutes() / 60;
  const nextIdx = schedule.findIndex((h) => h > nowH);

  if (!settings) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh', color: 'var(--ink-mute)', fontSize: 14 }}>
        Cargando ajustes…
      </div>
    );
  }

  const {
    name,
    night_silence: nightSilence,
    contextual,
    telegram_on: telegramOn,
    calendar_on: calendarOn,
    telegram_chat_id: telegramChatId,
    telegram_link_token: telegramLinkToken,
  } = settings;
  const telegramConnected = !!telegramChatId;
  const calendarConnected = !!session?.provider_token;
  const calendarEmail = session?.user?.email ?? null;

  const setName = (v: string) => update({ name: v });
  const setTelegramOn = (v: boolean) => update({ telegram_on: v });
  const setCalendarOn = (v: boolean) => update({ calendar_on: v });
  const setMode = (v: Mode) => update({ mode: v });
  const setPingsPerDay = (v: number) => update({ pings_per_day: v });
  const setWindowStart = (v: number) => update({ window_start: v });
  const setWindowEnd = (v: number) => update({ window_end: v });
  const setWeekendMode = (v: WeekendMode) => update({ weekend_mode: v });
  const setNightSilence = (v: boolean) => update({ night_silence: v });
  const setContextual = (v: UserSettings['contextual']) => update({ contextual: v });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Ajustes
        </h1>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>Notificaciones, integraciones y datos</div>
      </div>

      <NeuCard style={{ padding: 24 }}>
        <SettingRow title="Tu nombre" subtitle="Para el saludo de la app">
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 12,
              boxShadow: 'var(--neu-in)',
              padding: '6px 12px',
              width: '100%',
              maxWidth: 220,
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '8px 4px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            />
          </div>
        </SettingRow>
      </NeuCard>

      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--bg)',
              boxShadow: 'var(--neu-out-sm)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent)',
            }}
          >
            <Icon.Send />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Recordatorios por Telegram</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Tu bot te pedirá registrar tu estado</div>
          </div>
          <Toggle on={telegramOn} onChange={setTelegramOn} />
        </div>

        <div
          style={{
            opacity: telegramOn ? 1 : 0.4,
            pointerEvents: telegramOn ? 'auto' : 'none',
            transition: 'opacity .25s',
            display: 'grid',
            gap: 22,
          }}
        >
          <div>
            <Label>Modo</Label>
            <Segmented<Mode>
              value={mode}
              onChange={setMode}
              options={[
                { v: 'random', l: 'Aleatorio', s: 'Horas variables · más realista' },
                { v: 'fixed', l: 'Fijo', s: 'Mismas horas cada día' },
                { v: 'manual', l: 'Manual', s: 'Solo cuando escribas /mood' },
              ]}
            />
          </div>

          {mode !== 'manual' && (
            <div>
              <Label
                right={
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    {pingsPerDay}
                    <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}> / día</span>
                  </span>
                }
              >
                Pings por día
              </Label>
              <SliderRow min={1} max={8} value={pingsPerDay} onChange={setPingsPerDay} markers={[1, 2, 3, 4, 5, 6, 7, 8]} />
            </div>
          )}

          {mode !== 'manual' && (
            <div>
              <Label
                right={
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    {hToStr(windowStart)} <span style={{ color: 'var(--ink-faint)' }}>→</span> {hToStr(windowEnd)}
                  </span>
                }
              >
                Ventana activa
              </Label>
              <TimeRange
                start={windowStart}
                end={windowEnd}
                onChange={(s, e) => {
                  setWindowStart(s);
                  setWindowEnd(e);
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontSize: 10.5,
                  color: 'var(--ink-faint)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>24</span>
              </div>
            </div>
          )}

          {mode !== 'manual' && (
            <div>
              <Label>Fines de semana</Label>
              <Segmented<WeekendMode>
                value={weekendMode}
                onChange={setWeekendMode}
                size="sm"
                options={[
                  { v: 'same', l: 'Igual' },
                  { v: 'reduced', l: 'Reducido (mitad)' },
                  { v: 'off', l: 'Desactivado' },
                ]}
              />
            </div>
          )}

          <ToggleRow
            icon={<Icon.Moon />}
            title="Silencio nocturno automático"
            subtitle="No te escribe fuera de la ventana, ni si llevas más de 30 min inactivo en el móvil"
            on={nightSilence}
            onChange={setNightSilence}
          />

          <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ color: 'var(--accent)' }}>
                <Icon.Spark />
              </span>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>Modo contextual</div>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'var(--bg)',
                  boxShadow: 'var(--neu-out-xs)',
                  padding: '4px 9px',
                  borderRadius: 999,
                  letterSpacing: '0.06em',
                }}
              >
                BETA
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 14, lineHeight: 1.55 }}>
              Pings extra cuando tiene sentido — no cuentan contra tu límite diario.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <MiniToggle
                title="30 min tras despertar"
                subtitle="Detecta tu primer uso del móvil del día"
                on={contextual.wakeup}
                onChange={(v) => setContextual({ ...contextual, wakeup: v })}
              />
              <MiniToggle
                title="15 min tras un evento largo"
                subtitle="Reuniones >45 min en Google Calendar"
                on={contextual.postEvent}
                onChange={(v) => setContextual({ ...contextual, postEvent: v })}
                disabled={!calendarOn}
              />
              <MiniToggle
                title="Si llevas 5 h sin registrar"
                subtitle="Recordatorio suave si pierdes el ritmo"
                on={contextual.inactivity}
                onChange={(v) => setContextual({ ...contextual, inactivity: v })}
              />
            </div>
          </div>

          <SchedulePreview
            schedule={schedule}
            nextIdx={nextIdx}
            mode={mode}
            isWeekend={isWeekend}
            weekendMode={weekendMode}
            effectivePings={effectivePings}
            pingsPerDay={pingsPerDay}
          />
        </div>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: telegramConnected ? '#2e8b48' : '#b8bfcc' }} />
            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
              {telegramConnected ? 'Bot conectado' : 'Sin conexión'}
            </span>
          </div>

          {telegramConnected ? (
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.55 }}>
              Recibirás recordatorios en Telegram con un enlace para abrir la app y registrar tu estado. Comandos:{' '}
              <span className="mono">/pause 2h</span>, <span className="mono">/skip</span>,{' '}
              <span className="mono">/settings</span>.
            </div>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              <li>
                Abre Telegram y busca{' '}
                <a
                  href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono"
                  style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                >
                  @{TELEGRAM_BOT_USERNAME}
                </a>
              </li>
              <li>
                Envía{' '}
                <span className="mono" style={{ color: 'var(--ink)' }}>
                  /start {telegramLinkToken ?? '…'}
                </span>{' '}
                para vincular tu cuenta
              </li>
            </ol>
          )}
        </div>
      </NeuCard>

      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--bg)',
              boxShadow: 'var(--neu-out-sm)',
              display: 'grid',
              placeItems: 'center',
              color: '#E85A4F',
            }}
          >
            <Icon.Cal />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Google Calendar</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Cruza tu estado emocional con tus eventos</div>
          </div>
          <Toggle on={calendarOn} onChange={setCalendarOn} />
        </div>

        <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: calendarConnected ? '#2e8b48' : '#b8bfcc' }} />
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
              {calendarConnected
                ? `Conectado${calendarEmail ? ` · ${calendarEmail}` : ''}`
                : 'Sin conexión · vuelve a iniciar sesión para refrescar el permiso'}
            </span>
            {!calendarConnected && (
              <NeuButton onClick={() => signInWithGoogle()} style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}>
                Reconectar
              </NeuButton>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            Permisos: <span className="mono" style={{ color: 'var(--ink-soft)' }}>calendar.readonly</span>. Los eventos se leen para correlación en Insights — nunca se modifican.
          </div>
        </div>
      </NeuCard>

      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--bg)',
              boxShadow: 'var(--neu-out-sm)',
              display: 'grid',
              placeItems: 'center',
              color: '#3ECF8E',
            }}
          >
            <Icon.Bolt />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Datos en Supabase</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
              Tabla <span className="mono">mood_entries</span> · RLS activado
            </div>
          </div>
          <span
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
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5cb872' }} />
            En línea
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <NeuButton onClick={onSeed}>Cargar datos de ejemplo</NeuButton>
          <NeuButton onClick={onClear} style={{ color: 'var(--q-red)' }}>
            Borrar todas las entradas
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}
