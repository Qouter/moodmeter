// Screens: Check-in, Insights, History, Settings.

const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatTime(d) {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(d) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
function shortDate(d) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// =============== CHECK-IN ===============
function CheckInScreen({ entries, onAdd, lastEntry }) {
  const [selected, setSelected] = uS(null);
  const [word, setWord] = uS('');
  const [sheetOpen, setSheetOpen] = uS(false);
  const [savedFlash, setSavedFlash] = uS(false);
  const inputRef = uR(null);
  const { quadrant, quadrantMeta, MOOD_LABELS, displayCoord, cellColor } = window.MoodData;

  const onSelect = (cell) => {
    setSelected(cell);
    setWord('');
    setSheetOpen(true);
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  const onSave = () => {
    if (!selected) return;
    const entry = {
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
  const moodLabel = selected ? MOOD_LABELS[9 - selected.y][selected.x] : '';

  // Today's count
  const today = uM(() => {
    const t = new Date(); t.setHours(0,0,0,0);
    return entries.filter((e) => new Date(e.t) >= t).length;
  }, [entries]);

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {/* Greeting card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {timeOfDayGreeting()}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink-mute)' }}>
            {formatDate(new Date())} · <span className="mono">{formatTime(new Date())}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <NeuCard inset style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 90 }}>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{today}</span>
            <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>hoy</span>
          </NeuCard>
          <NeuCard inset style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 90 }}>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{entries.length}</span>
            <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>total</span>
          </NeuCard>
        </div>
      </div>

      {/* Main grid card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 320px)', gap: 22, alignItems: 'start' }} className="checkin-grid">
        <NeuCard style={{ padding: 26 }}>
          <MoodGrid selected={selected} onSelect={onSelect} />
        </NeuCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <NeuCard style={{ padding: 22 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Última entrada</div>
            {lastEntry ? <LastEntryPreview entry={lastEntry} /> : (
              <div style={{ fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.55 }}>Aún no hay registros. Elige un cuadrado del mapa para empezar.</div>
            )}
          </NeuCard>

          <NeuCard style={{ padding: 22 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Próxima notificación</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg)', boxShadow: 'var(--neu-in)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
                <Icon.Bell />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>en 1h 47m</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>vía Telegram · @moodmeter_bot</div>
              </div>
            </div>
          </NeuCard>
        </div>
      </div>

      {/* Bottom sheet for word input */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: cellColor(selected.x, selected.y),
                boxShadow: '0 8px 18px rgba(40,55,90,.18), inset 0 0 0 2px rgba(255,255,255,.7)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>¿Cómo lo nombrarías?</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: qm.dot }} />
                  {qm.name}
                  <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ink-faint)' }}>
                    P {coord.pleasantness >= 0 ? '+' : ''}{coord.pleasantness} · E {coord.energy >= 0 ? '+' : ''}{coord.energy}
                  </span>
                </div>
              </div>
              <button onClick={() => setSheetOpen(false)} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg)', boxShadow: 'var(--neu-out-sm)',
                display: 'grid', placeItems: 'center', color: 'var(--ink-soft)',
              }} aria-label="cerrar"><Icon.Close /></button>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Una palabra</label>
              <div style={{
                marginTop: 8,
                background: 'var(--bg)',
                borderRadius: 16,
                boxShadow: 'var(--neu-in)',
                padding: '4px 8px',
              }}>
                <input
                  ref={inputRef}
                  value={word}
                  onChange={(e) => setWord(e.target.value.slice(0, 32))}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSave(); }}
                  placeholder=""
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    padding: '14px 12px', fontSize: 18, fontWeight: 500, color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <NeuButton onClick={() => setSheetOpen(false)} style={{ flex: 1 }}>Volver</NeuButton>
              <NeuButton variant="primary" onClick={onSave} disabled={!word.trim()} style={{ flex: 1.5 }} leadingIcon={<Icon.Check />}>
                Guardar
              </NeuButton>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Saved flash */}
      {savedFlash && (
        <div style={{
          position: 'fixed', left: '50%', top: 'calc(env(safe-area-inset-top, 0px) + 28px)',
          transform: 'translateX(-50%)',
          background: 'var(--bg)', borderRadius: 999,
          boxShadow: '0 12px 30px rgba(40,55,90,.22), var(--neu-out)',
          padding: '12px 22px', display: 'inline-flex', alignItems: 'center', gap: 10,
          fontWeight: 600, color: 'var(--ink)',
          animation: 'pop .4s cubic-bezier(.2,.8,.2,1)',
          zIndex: 100,
        }}>
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(145deg,#7286ff,#5c70ee)', color: '#fff', display: 'grid', placeItems: 'center' }}>
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

function LastEntryPreview({ entry }) {
  const { cellColor, quadrant, quadrantMeta } = window.MoodData;
  const q = quadrant(entry.x, entry.y);
  const qm = quadrantMeta(q);
  const d = new Date(entry.t);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: cellColor(entry.x, entry.y),
        boxShadow: '0 4px 10px rgba(40,55,90,.18), inset 0 0 0 1.5px rgba(255,255,255,.6)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{entry.label}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
          <em style={{ fontStyle: 'normal', color: 'var(--ink-soft)' }}>"{entry.word || '—'}"</em>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {formatTime(d)}<br/>
        <span style={{ color: 'var(--ink-faint)' }}>{shortDate(d)}</span>
      </div>
    </div>
  );
}

function suggestionsFor(q) {
  return ({
    'high-unpleasant': ['agobio','tensión','prisa','enfado'],
    'high-pleasant':   ['flow','foco','chispa','motivado'],
    'low-unpleasant':  ['cansado','bajón','vacío','duda'],
    'low-pleasant':    ['calma','paz','relax','grato'],
  })[q] || [];
}

// =============== INSIGHTS ===============
function InsightsScreen({ entries }) {
  const { quadrant } = window.MoodData;
  const [range, setRange] = uS('7'); // 7 / 14 / 30

  const filtered = uM(() => {
    const days = parseInt(range, 10);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days + 1); cutoff.setHours(0,0,0,0);
    return entries.filter((e) => new Date(e.t) >= cutoff);
  }, [entries, range]);

  // Daily averages for line chart
  const dailyData = uM(() => {
    const days = parseInt(range, 10);
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const key = d.toDateString();
      buckets[key] = { date: d, sumP: 0, sumE: 0, n: 0 };
    }
    for (const e of filtered) {
      const key = new Date(e.t); key.setHours(0,0,0,0);
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

  // Quadrant counts
  const counts = uM(() => {
    const c = {};
    for (const e of filtered) {
      const q = quadrant(e.x, e.y);
      c[q] = (c[q] || 0) + 1;
    }
    return c;
  }, [filtered]);

  // Heatmap on grid
  const heat = uM(() => {
    const h = {};
    for (const e of filtered) h[`${e.x},${e.y}`] = (h[`${e.x},${e.y}`] || 0) + 1;
    return h;
  }, [filtered]);

  // Headline stats
  const avgP = filtered.length ? filtered.reduce((a,b) => a + (b.x - 4.5), 0) / filtered.length : 0;
  const avgE = filtered.length ? filtered.reduce((a,b) => a + (b.y - 4.5), 0) / filtered.length : 0;

  // Streak (consecutive days with ≥1 check-in)
  const streak = uM(() => {
    let s = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const has = entries.some((e) => {
        const ed = new Date(e.t); ed.setHours(0,0,0,0);
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
          <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>Tu evolución</h1>
          <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>Cómo se mueve tu energía y placer en el tiempo</div>
        </div>
        <RangeSwitch value={range} onChange={setRange} />
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <NeuCard><Stat label="Placer medio" value={`${avgP >= 0 ? '+' : ''}${avgP.toFixed(1)}`} sublabel="-5 a +5" accent="#2e8b48" /></NeuCard>
        <NeuCard><Stat label="Energía media" value={`${avgE >= 0 ? '+' : ''}${avgE.toFixed(1)}`} sublabel="-5 a +5" accent="#e85a4f" /></NeuCard>
        <NeuCard><Stat label="Registros" value={filtered.length} sublabel={`en ${range} días`} /></NeuCard>
        <NeuCard><Stat label="Racha" value={`${streak}d`} sublabel="días consecutivos" accent="var(--accent)" /></NeuCard>
      </div>

      {/* Line chart card */}
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

      {/* Two-col: donut + heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }} className="insight-2col">
        <NeuCard style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Reparto por cuadrante</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 18 }}>Dónde caes la mayoría del tiempo</div>
          <QuadrantDonut counts={counts} />
        </NeuCard>

        <NeuCard style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Patrón semanal</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 18 }}>Placer medio por hora y día</div>
          <div style={{ overflowX: 'auto' }}><HourDowHeat entries={filtered} /></div>
        </NeuCard>
      </div>

      {/* Grid heatmap + top words */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }} className="insight-2col">
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

      {/* Calendar correlation */}
      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Cruzando con tu calendario</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Estado medio en torno a tus eventos recurrentes</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'var(--bg)', boxShadow: 'var(--neu-in)', fontSize: 12, color: 'var(--ink-soft)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5cb872' }} />
            Google Calendar conectado
          </div>
        </div>
        <CalendarCorrelation entries={filtered} />
      </NeuCard>

      <style>{`
        @media (max-width: 760px) {
          .insight-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function RangeSwitch({ value, onChange }) {
  const opts = [{v:'7',l:'7d'},{v:'14',l:'14d'},{v:'30',l:'30d'}];
  return (
    <div style={{ display: 'inline-flex', padding: 5, borderRadius: 999, background: 'var(--bg)', boxShadow: 'var(--neu-in)', gap: 4 }}>
      {opts.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          color: value === o.v ? 'var(--ink)' : 'var(--ink-mute)',
          background: value === o.v ? 'var(--bg)' : 'transparent',
          boxShadow: value === o.v ? 'var(--neu-out-sm)' : 'none',
          transition: 'all .2s ease',
        }} className="mono">{o.l}</button>
      ))}
    </div>
  );
}

// =============== HISTORY ===============
function HistoryScreen({ entries, onDelete }) {
  const { cellColor, quadrant, quadrantMeta } = window.MoodData;
  // Group by day descending
  const groups = uM(() => {
    const byDay = {};
    for (const e of entries) {
      const d = new Date(e.t); d.setHours(0,0,0,0);
      const k = d.toISOString();
      if (!byDay[k]) byDay[k] = { date: d, items: [] };
      byDay[k].items.push(e);
    }
    return Object.values(byDay).sort((a,b) => b.date - a.date).map((g) => ({
      ...g,
      items: g.items.sort((a,b) => new Date(b.t) - new Date(a.t)),
    }));
  }, [entries]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>Historial</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>{entries.length} entradas guardadas</div>
      </div>

      {groups.length === 0 && (
        <NeuCard><div style={{ color: 'var(--ink-mute)', textAlign: 'center', padding: 20 }}>Aún sin entradas. Haz un registro para empezar.</div></NeuCard>
      )}

      {groups.map((g) => {
        const avgP = g.items.reduce((a,b) => a + (b.x - 4.5), 0) / g.items.length;
        const avgE = g.items.reduce((a,b) => a + (b.y - 4.5), 0) / g.items.length;
        return (
          <NeuCard key={g.date.toISOString()} style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{formatDate(g.date)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{g.items.length} registro{g.items.length === 1 ? '' : 's'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <MoodPill p={avgP} e={avgE} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.items.map((e) => {
                const q = quadrant(e.x, e.y);
                const qm = quadrantMeta(q);
                return (
                  <div key={e.id} style={{
                    display: 'grid', gridTemplateColumns: '52px 1fr auto auto', gap: 14, alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'var(--bg)',
                    boxShadow: 'var(--neu-out-xs)',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: cellColor(e.x, e.y),
                      boxShadow: '0 4px 10px rgba(40,55,90,.18), inset 0 0 0 1.5px rgba(255,255,255,.6)',
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700 }}>{e.label}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
                        <em style={{ fontStyle: 'normal', color: 'var(--ink-soft)' }}>"{e.word || '—'}"</em>
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'right' }}>
                      {formatTime(new Date(e.t))}
                    </div>
                    <button onClick={() => onDelete(e.id)} aria-label="eliminar" style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--bg)', boxShadow: 'var(--neu-out-xs)',
                      color: 'var(--ink-mute)', display: 'grid', placeItems: 'center',
                    }}>
                      <Icon.Close />
                    </button>
                  </div>
                );
              })}
            </div>
          </NeuCard>
        );
      })}
    </div>
  );
}

// =============== SETTINGS ===============
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hToStr(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function computeSchedule({ mode, pingsPerDay, windowStart, windowEnd }, dateSeed) {
  if (mode === 'manual' || pingsPerDay <= 0) return [];
  const span = Math.max(0.5, windowEnd - windowStart);
  if (mode === 'fixed') {
    const step = span / pingsPerDay;
    return Array.from({length: pingsPerDay}, (_, i) => windowStart + step * (i + 0.5));
  }
  const rng = mulberry32(dateSeed);
  const minGap = Math.max(0.75, Math.min(2, span / (pingsPerDay + 1.2)));
  for (let attempts = 0; attempts < 80; attempts++) {
    const times = Array.from({length: pingsPerDay}, () => windowStart + rng() * span).sort((a,b) => a-b);
    let ok = true;
    for (let i = 1; i < times.length; i++) if (times[i] - times[i-1] < minGap) { ok = false; break; }
    if (ok) return times;
  }
  const step = span / pingsPerDay;
  return Array.from({length: pingsPerDay}, (_, i) => windowStart + step * (i + 0.5) + (rng() - 0.5) * 0.4);
}

function SettingsScreen({ onClear, onSeed }) {
  const [telegramOn, setTelegramOn] = uS(true);
  const [calendarOn, setCalendarOn] = uS(true);
  const [name, setName] = uS('Diego');

  // ====== Frequency config ======
  const [mode, setMode] = uS('random'); // random | fixed | manual
  const [pingsPerDay, setPingsPerDay] = uS(4);
  const [windowStart, setWindowStart] = uS(9);
  const [windowEnd, setWindowEnd] = uS(22);
  const [weekendMode, setWeekendMode] = uS('reduced'); // same | reduced | off
  const [nightSilence, setNightSilence] = uS(true);
  const [contextual, setContextual] = uS({ wakeup: true, postEvent: true, inactivity: false });

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const effectivePings = uM(() => {
    if (mode === 'manual') return 0;
    if (isWeekend && weekendMode === 'off') return 0;
    if (isWeekend && weekendMode === 'reduced') return Math.max(1, Math.ceil(pingsPerDay / 2));
    return pingsPerDay;
  }, [mode, isWeekend, weekendMode, pingsPerDay]);

  const dateSeed = today.getFullYear() * 1000 + today.getMonth() * 31 + today.getDate();
  const schedule = uM(
    () => computeSchedule({ mode, pingsPerDay: effectivePings, windowStart, windowEnd }, dateSeed),
    [mode, effectivePings, windowStart, windowEnd, dateSeed]
  );

  // Find next ping ahead of "now"
  const nowH = today.getHours() + today.getMinutes() / 60;
  const nextIdx = schedule.findIndex((h) => h > nowH);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>Ajustes</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>Notificaciones, integraciones y datos</div>
      </div>

      <NeuCard style={{ padding: 24 }}>
        <SettingRow title="Tu nombre" subtitle="Para el saludo de la app">
          <div style={{
            background: 'var(--bg)', borderRadius: 12, boxShadow: 'var(--neu-in)',
            padding: '6px 12px', width: 220,
          }}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{
              width: '100%', background: 'transparent', border: 'none', padding: '8px 4px',
              fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            }} />
          </div>
        </SettingRow>
      </NeuCard>

      {/* Telegram + Frecuencia */}
      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', boxShadow: 'var(--neu-out-sm)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
            <Icon.Send />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Recordatorios por Telegram</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Tu bot te pedirá registrar tu estado</div>
          </div>
          <Toggle on={telegramOn} onChange={setTelegramOn} />
        </div>

        <div style={{ opacity: telegramOn ? 1 : 0.4, pointerEvents: telegramOn ? 'auto' : 'none', transition: 'opacity .25s', display: 'grid', gap: 22 }}>
          {/* Mode */}
          <div>
            <Label>Modo</Label>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { v: 'random', l: 'Aleatorio', s: 'Horas variables · más realista' },
                { v: 'fixed',  l: 'Fijo',      s: 'Mismas horas cada día' },
                { v: 'manual', l: 'Manual',    s: 'Solo cuando escribas /mood' },
              ]}
            />
          </div>

          {/* Pings per day */}
          {mode !== 'manual' && (
            <div>
              <Label
                right={<span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{pingsPerDay}<span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}> / día</span></span>}
              >Pings por día</Label>
              <SliderRow min={1} max={8} value={pingsPerDay} onChange={setPingsPerDay} markers={[1,2,3,4,5,6,7,8]} />
            </div>
          )}

          {/* Time window */}
          {mode !== 'manual' && (
            <div>
              <Label
                right={
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    {hToStr(windowStart)} <span style={{ color: 'var(--ink-faint)' }}>→</span> {hToStr(windowEnd)}
                  </span>
                }
              >Ventana activa</Label>
              <TimeRange
                start={windowStart}
                end={windowEnd}
                onChange={(s, e) => { setWindowStart(s); setWindowEnd(e); }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: 'var(--ink-faint)', fontFamily: 'JetBrains Mono, monospace' }}>
                <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
              </div>
            </div>
          )}

          {/* Weekend */}
          {mode !== 'manual' && (
            <div>
              <Label>Fines de semana</Label>
              <Segmented
                value={weekendMode}
                onChange={setWeekendMode}
                size="sm"
                options={[
                  { v: 'same',     l: 'Igual' },
                  { v: 'reduced',  l: 'Reducido (mitad)' },
                  { v: 'off',      l: 'Desactivado' },
                ]}
              />
            </div>
          )}

          {/* Silencio nocturno */}
          <ToggleRow
            icon={<Icon.Moon />}
            title="Silencio nocturno automático"
            subtitle="No te escribe fuera de la ventana, ni si llevas más de 30 min inactivo en el móvil"
            on={nightSilence}
            onChange={setNightSilence}
          />

          {/* Modo contextual */}
          <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ color: 'var(--accent)' }}><Icon.Spark /></span>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>Modo contextual</div>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', background: 'var(--bg)', boxShadow: 'var(--neu-out-xs)', padding: '4px 9px', borderRadius: 999, letterSpacing: '0.06em' }}>BETA</span>
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

          {/* Preview */}
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

        <details style={{ marginTop: 18 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--ink-mute)', fontWeight: 600, padding: '4px 0' }}>Cómo conectar el bot</summary>
          <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              <li>Abre tu app de mensajería y busca <span className="mono" style={{ color: 'var(--ink)' }}>@moodmeter_bot</span></li>
              <li>Envía <span className="mono" style={{ color: 'var(--ink)' }}>/start MM-A7K2-XQ91</span> para vincular tu cuenta</li>
              <li>Comandos útiles: <span className="mono">/mood</span>, <span className="mono">/pause 2h</span>, <span className="mono">/skip</span>, <span className="mono">/settings</span></li>
            </ol>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: telegramOn ? '#2e8b48' : '#b8bfcc' }} />
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {telegramOn ? 'Bot conectado · @diegoq' : 'Sin conexión'}
              </span>
            </div>
          </div>
        </details>
      </NeuCard>

      {/* Calendar */}
      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', boxShadow: 'var(--neu-out-sm)', display: 'grid', placeItems: 'center', color: '#E85A4F' }}>
            <Icon.Cal />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Google Calendar</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Cruza tu estado emocional con tus eventos</div>
          </div>
          <Toggle on={calendarOn} onChange={setCalendarOn} />
        </div>

        <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: calendarOn ? '#2e8b48' : '#b8bfcc' }} />
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
              {calendarOn ? 'Conectado · diego@gmail.com' : 'Sin conexión'}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            Permisos: <span className="mono" style={{ color: 'var(--ink-soft)' }}>calendar.events.readonly</span>. Los eventos se leen para correlación en Insights — nunca se modifican.
          </div>
        </div>
      </NeuCard>

      {/* Data / Supabase */}
      <NeuCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', boxShadow: 'var(--neu-out-sm)', display: 'grid', placeItems: 'center', color: '#3ECF8E' }}>
            <Icon.Bolt />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Datos en Supabase</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Tabla <span className="mono">mood_entries</span> · RLS activado</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'var(--bg)', boxShadow: 'var(--neu-in)', fontSize: 12, color: 'var(--ink-soft)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5cb872' }} />
            En línea
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <NeuButton onClick={onSeed}>Cargar datos de ejemplo</NeuButton>
          <NeuButton onClick={onClear} style={{ color: 'var(--q-red)' }}>Borrar todas las entradas</NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}

function SettingRow({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 56, height: 32, borderRadius: 999,
      background: 'var(--bg)',
      boxShadow: on ? 'inset 3px 3px 6px rgba(80,100,200,.35), inset -3px -3px 6px rgba(255,255,255,.6)' : 'var(--neu-in)',
      position: 'relative', transition: 'all .25s ease',
    }}>
      <span style={{
        position: 'absolute', top: 4, left: on ? 28 : 4,
        width: 24, height: 24, borderRadius: '50%',
        background: on ? 'linear-gradient(145deg,#7286ff,#5c70ee)' : 'var(--bg)',
        boxShadow: on ? '0 3px 8px rgba(80,100,200,.4)' : 'var(--neu-out-sm)',
        transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
      }} />
    </button>
  );
}

function FreqSelect() { return null; } // legacy, unused

// ---- Frequency helpers ----
function Label({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</div>
      {right}
    </div>
  );
}

function Segmented({ value, onChange, options, size }) {
  const isLg = size !== 'sm';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      gap: 6, padding: 6, borderRadius: 16,
      background: 'var(--bg)', boxShadow: 'var(--neu-in)',
    }}>
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: isLg ? '12px 10px' : '9px 10px',
            borderRadius: 12,
            background: active ? 'var(--bg)' : 'transparent',
            boxShadow: active ? 'var(--neu-out-sm)' : 'none',
            color: active ? 'var(--ink)' : 'var(--ink-mute)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            transition: 'all .22s ease',
          }}>
            <span style={{ fontSize: isLg ? 13.5 : 12.5, fontWeight: 700 }}>{o.l}</span>
            {o.s && <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 500, letterSpacing: '0', textAlign: 'center', lineHeight: 1.3 }}>{o.s}</span>}
          </button>
        );
      })}
    </div>
  );
}

function SliderRow({ min, max, value, onChange, markers }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', paddingTop: 8 }}>
      <div style={{
        position: 'relative', height: 10, borderRadius: 999,
        background: 'var(--bg)', boxShadow: 'var(--neu-in)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`,
          borderRadius: 999,
          background: 'linear-gradient(90deg, var(--accent-soft), var(--accent))',
        }} />
        <input
          type="range" min={min} max={max} step={1} value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
        <div style={{
          position: 'absolute', top: '50%', left: `calc(${pct}% - 11px)`,
          width: 22, height: 22, borderRadius: '50%',
          background: 'linear-gradient(145deg, #fff, #e6e9f0)',
          boxShadow: '0 4px 10px rgba(40,55,90,.25), inset 0 0 0 2px var(--bg)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }} />
      </div>
      {markers && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--ink-faint)', fontFamily: 'JetBrains Mono, monospace' }}>
          {markers.map((m) => <span key={m} style={{ color: m === value ? 'var(--accent)' : 'inherit', fontWeight: m === value ? 700 : 500 }}>{m}</span>)}
        </div>
      )}
    </div>
  );
}

function TimeRange({ start, end, onChange }) {
  const min = 0, max = 24, step = 0.5, gap = 1;
  const leftPct = (start / max) * 100;
  const rightPct = (end / max) * 100;
  return (
    <div style={{ position: 'relative', height: 28 }}>
      <div style={{
        position: 'absolute', top: 11, left: 0, right: 0, height: 8,
        borderRadius: 999, background: 'var(--bg)', boxShadow: 'var(--neu-in)',
      }} />
      <div style={{
        position: 'absolute', top: 11, left: `${leftPct}%`, width: `${rightPct - leftPct}%`, height: 8,
        borderRadius: 999,
        background: 'linear-gradient(90deg, var(--accent-soft), var(--accent))',
      }} />
      {/* start thumb input */}
      <input
        type="range" min={min} max={max} step={step} value={start}
        onChange={(e) => {
          const v = Math.min(parseFloat(e.target.value), end - gap);
          onChange(v, end);
        }}
        className="tr-input"
      />
      {/* end thumb input */}
      <input
        type="range" min={min} max={max} step={step} value={end}
        onChange={(e) => {
          const v = Math.max(parseFloat(e.target.value), start + gap);
          onChange(start, v);
        }}
        className="tr-input"
      />
      {/* thumbs (visual) */}
      <div style={{ position: 'absolute', top: 1, left: `calc(${leftPct}% - 14px)`, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(145deg, #fff, #e6e9f0)', boxShadow: '0 4px 10px rgba(40,55,90,.25), inset 0 0 0 2px var(--bg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 1, left: `calc(${rightPct}% - 14px)`, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(145deg, #fff, #e6e9f0)', boxShadow: '0 4px 10px rgba(40,55,90,.25), inset 0 0 0 2px var(--bg)', pointerEvents: 'none' }} />
      <style>{`
        .tr-input {
          position: absolute; inset: 0; width: 100%; height: 100%;
          background: transparent; appearance: none; -webkit-appearance: none;
          pointer-events: none; margin: 0;
        }
        .tr-input::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 28px; height: 28px; border-radius: 50%;
          background: transparent; cursor: pointer; pointer-events: auto;
        }
        .tr-input::-moz-range-thumb {
          width: 28px; height: 28px; border-radius: 50%;
          background: transparent; border: none; cursor: pointer; pointer-events: auto;
        }
        .tr-input::-webkit-slider-runnable-track { background: transparent; }
        .tr-input::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  );
}

function ToggleRow({ icon, title, subtitle, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {icon && (
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', boxShadow: 'var(--neu-out-sm)', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)' }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.4, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function MiniToggle({ title, subtitle, on, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', opacity: disabled ? 0.4 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      <MiniSwitch on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function MiniSwitch({ on, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} disabled={disabled} aria-pressed={on} style={{
      width: 44, height: 26, borderRadius: 999,
      background: 'var(--bg)',
      boxShadow: on ? 'inset 2px 2px 5px rgba(80,100,200,.35), inset -2px -2px 5px rgba(255,255,255,.6)' : 'var(--neu-in)',
      position: 'relative', transition: 'all .25s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: on ? 'linear-gradient(145deg,#7286ff,#5c70ee)' : 'var(--bg)',
        boxShadow: on ? '0 2px 5px rgba(80,100,200,.4)' : 'var(--neu-out-xs)',
        transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
      }} />
    </button>
  );
}

function SchedulePreview({ schedule, nextIdx, mode, isWeekend, weekendMode, effectivePings, pingsPerDay }) {
  const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }} className="preview-2col">
      {/* Today's schedule */}
      <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hoy</div>
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
                  <span key={i} className="mono" style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                    background: 'var(--bg)',
                    boxShadow: isNext ? '0 4px 12px rgba(108,127,255,.35), inset 0 0 0 1.5px var(--accent)' : (isPast ? 'var(--neu-in)' : 'var(--neu-out-xs)'),
                    color: isNext ? 'var(--accent)' : (isPast ? 'var(--ink-faint)' : 'var(--ink)'),
                    textDecoration: isPast ? 'line-through' : 'none',
                  }}>{hToStr(h)}</span>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 12, lineHeight: 1.5 }}>
              {effectivePings} ping{effectivePings === 1 ? '' : 's'}
              {isWeekend && weekendMode === 'reduced' && effectivePings < pingsPerDay && (
                <span> · reducido por fin de semana</span>
              )}
              {mode === 'random' && <span> · horas regeneradas cada día</span>}
              {mode === 'fixed' && <span> · mismas horas a diario</span>}
            </div>
          </>
        )}
      </div>

      {/* Bot message mock */}
      <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', boxShadow: 'var(--neu-in)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vista previa del mensaje</div>
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

function ChatMock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(145deg, #fdfffb 0%, #eaf3e6 100%)',
          boxShadow: '0 3px 8px rgba(120,160,110,.3), inset 0 0 0 1.2px rgba(255,255,255,.9)',
          flexShrink: 0,
        }} />
        <div style={{
          background: 'var(--bg)',
          boxShadow: 'var(--neu-out-sm)',
          padding: '12px 14px',
          borderRadius: '14px 14px 14px 4px',
          maxWidth: 280,
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--ink)',
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>moodmeter_bot</div>
          ¿Cómo te encuentras ahora mismo? Abre el mapa o respóndeme con una palabra.
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <ChipBtn>Abrir mapa</ChipBtn>
            <ChipBtn>Saltar</ChipBtn>
            <ChipBtn>Pausar 2h</ChipBtn>
          </div>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginLeft: 40 }}>14:15 · entregado</div>
    </div>
  );
}

function ChipBtn({ children }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600,
      padding: '6px 10px', borderRadius: 999,
      background: 'var(--bg)',
      boxShadow: 'var(--neu-out-xs)',
      color: 'var(--ink-soft)',
    }}>{children}</span>
  );
}

Object.assign(window, { CheckInScreen, InsightsScreen, HistoryScreen, SettingsScreen });
