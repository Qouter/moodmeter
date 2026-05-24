// SVG charts with neumorphic styling.

const { useMemo: useMemoCh } = React;

// Line chart: pleasantness + energy over days. data = [{date, pleasantness, energy}]
function LineChart({ data, height = 220 }) {
  const W = 720, H = height, P = { l: 32, r: 18, t: 14, b: 24 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  if (!data.length) return null;

  const xs = data.map((_, i) => P.l + (i / Math.max(1, data.length - 1)) * innerW);
  const yScale = (v) => {
    // v range -5..+5 mapped to innerH..0
    const t = (v + 5) / 10;
    return P.t + innerH - t * innerH;
  };

  const linePath = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${yScale(d[key]).toFixed(1)}`).join(' ');
  const areaPath = (key) => `${linePath(key)} L ${xs[xs.length - 1]} ${yScale(-5)} L ${xs[0]} ${yScale(-5)} Z`;

  // X axis ticks: pick ~5
  const tickIdx = data.length <= 6 ? data.map((_, i) => i) : [0, Math.floor(data.length/4), Math.floor(data.length/2), Math.floor(3*data.length/4), data.length-1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lc-pleasant" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5cb872" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#5cb872" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lc-energy" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e85a4f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e85a4f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[-5, -2.5, 0, 2.5, 5].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={yScale(v)} y2={yScale(v)} stroke="rgba(40,55,90,.08)" strokeWidth={v === 0 ? 1.2 : 0.8} strokeDasharray={v === 0 ? '0' : '3 4'} />
          <text x={P.l - 6} y={yScale(v) + 3} fontSize="10" textAnchor="end" fill="var(--ink-mute)" fontFamily="JetBrains Mono">{v > 0 ? `+${v}` : v}</text>
        </g>
      ))}

      {/* energy area + line */}
      <path d={areaPath('energy')} fill="url(#lc-energy)" />
      <path d={linePath('energy')} fill="none" stroke="#e85a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* pleasantness area + line */}
      <path d={areaPath('pleasantness')} fill="url(#lc-pleasant)" />
      <path d={linePath('pleasantness')} fill="none" stroke="#2e8b48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* dots on last point */}
      <circle cx={xs[xs.length-1]} cy={yScale(data[data.length-1].pleasantness)} r="4.5" fill="#2e8b48" stroke="#fff" strokeWidth="2" />
      <circle cx={xs[xs.length-1]} cy={yScale(data[data.length-1].energy)} r="4.5" fill="#e85a4f" stroke="#fff" strokeWidth="2" />

      {/* x labels */}
      {tickIdx.map((i) => (
        <text key={i} x={xs[i]} y={H - 6} fontSize="10" textAnchor="middle" fill="var(--ink-mute)" fontFamily="JetBrains Mono">{data[i].label}</text>
      ))}
    </svg>
  );
}

// Donut for quadrant distribution
function QuadrantDonut({ counts, size = 180 }) {
  // counts: { 'high-unpleasant': n, ... }
  const total = Object.values(counts).reduce((a,b) => a+b, 0) || 1;
  const order = ['high-pleasant','high-unpleasant','low-unpleasant','low-pleasant'];
  const colors = { 'high-pleasant':'#e7b733','high-unpleasant':'#e85a4f','low-unpleasant':'#4a76c6','low-pleasant':'#5cb872' };

  const cx = size/2, cy = size/2, r = size/2 - 14, stroke = 22;
  let acc = 0;
  const arcs = order.map((q) => {
    const v = counts[q] || 0;
    const frac = v / total;
    const dash = frac * (2 * Math.PI * r);
    const gap = (2 * Math.PI * r) - dash;
    const rot = (acc / total) * 360 - 90;
    acc += v;
    return { q, frac, dash, gap, rot, color: colors[q] };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--shadow-dark)" strokeOpacity="0.25" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${a.dash} ${a.gap}`}
                  transform={`rotate(${a.rot} ${cx} ${cy})`}
                  strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 4} fontSize="26" fontWeight="700" textAnchor="middle" fontFamily="Plus Jakarta Sans" fill="var(--ink)">{total}</text>
        <text x={cx} y={cy + 14} fontSize="10" textAnchor="middle" fill="var(--ink-mute)" letterSpacing="1" fontWeight="600">CHECK-INS</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
        {arcs.map((a) => (
          <div key={a.q} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: a.color, boxShadow: '0 2px 4px rgba(40,55,90,.18)' }} />
            <span style={{ color: 'var(--ink-soft)', minWidth: 180, fontWeight: 500, whiteSpace: 'nowrap' }}>{labelQ(a.q)}</span>
            <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{Math.round(a.frac*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function labelQ(q) {
  return ({
    'high-pleasant':'Alta energía · Agradable',
    'high-unpleasant':'Alta energía · Desagradable',
    'low-unpleasant':'Baja energía · Desagradable',
    'low-pleasant':'Baja energía · Agradable',
  })[q];
}

// Heatmap of hour-of-day x day-of-week (mood pleasantness avg)
function HourDowHeat({ entries }) {
  const dows = ['L','M','X','J','V','S','D']; // Mon..Sun
  const hours = Array.from({length: 14}, (_, i) => i + 7); // 7..20

  // Build map: dow(0=Mon)→ hour → avg pleasantness (x - 4.5)
  const grid = {};
  for (const e of entries) {
    const d = new Date(e.t);
    let dow = d.getDay() - 1; if (dow < 0) dow = 6;
    const h = d.getHours();
    if (h < 7 || h > 20) continue;
    const key = `${dow},${h}`;
    if (!grid[key]) grid[key] = { sum: 0, n: 0 };
    grid[key].sum += (e.x - 4.5); // pleasantness
    grid[key].n += 1;
  }

  const cellSize = 22;
  const gap = 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `28px repeat(${hours.length}, ${cellSize}px)`, gap }}>
        <div />
        {hours.map((h) => (
          <div key={h} className="mono" style={{ fontSize: 9.5, color: 'var(--ink-mute)', textAlign: 'center' }}>{h}</div>
        ))}
        {dows.map((d, di) => (
          <React.Fragment key={d}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', alignSelf: 'center', textTransform: 'uppercase' }}>{d}</div>
            {hours.map((h) => {
              const g = grid[`${di},${h}`];
              const v = g ? g.sum / g.n : null;
              const t = v == null ? 0 : Math.max(-1, Math.min(1, v / 4.5));
              const bg = v == null
                ? 'rgba(40,55,90,0.05)'
                : t >= 0
                  ? `rgba(92, 184, 114, ${0.18 + t * 0.65})`
                  : `rgba(232, 90, 79, ${0.18 + Math.abs(t) * 0.65})`;
              return (
                <div key={h} title={v != null ? `${v.toFixed(1)} · ${g.n} entradas` : 'sin datos'}
                  style={{
                    width: cellSize, height: cellSize, borderRadius: 5, background: bg,
                    boxShadow: g ? 'inset 0 0 0 1px rgba(255,255,255,.55)' : 'none',
                  }} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 10.5, color: 'var(--ink-mute)' }}>
        <span>menos agradable</span>
        <span style={{ width: 90, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #e85a4f, rgba(40,55,90,.1), #5cb872)' }} />
        <span>más agradable</span>
      </div>
    </div>
  );
}

// Mini bars: top words
function TopWords({ entries, limit = 8 }) {
  const counts = {};
  for (const e of entries) {
    const w = (e.word || '').trim().toLowerCase();
    if (!w) continue;
    counts[w] = (counts[w] || 0) + 1;
  }
  const items = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, limit);
  const max = items[0]?.[1] || 1;
  if (!items.length) return <div style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Sin palabras todavía</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(([w, c]) => (
        <div key={w} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 36px', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{w}</div>
          <div style={{ height: 10, borderRadius: 999, background: 'var(--bg)', boxShadow: 'var(--neu-in)', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0,
              width: `${(c / max) * 100}%`,
              background: 'linear-gradient(90deg, #aeb8ff, #6c7fff)',
              borderRadius: 999,
              boxShadow: '0 1px 3px rgba(80,100,200,.4)',
            }} />
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'right' }}>×{c}</div>
        </div>
      ))}
    </div>
  );
}

// Calendar correlation strip: events with mood avg overlay
function CalendarCorrelation({ entries }) {
  const { MOCK_CALENDAR } = window.MoodData;
  // For each event title, take entries within ±1 hour of event hour on same day
  const rows = MOCK_CALENDAR.map((ev) => {
    const samples = entries.filter((e) => {
      const d = new Date(e.t);
      return Math.abs(d.getHours() - ev.hour) <= 1;
    });
    const n = samples.length;
    const avgP = n ? samples.reduce((a,b) => a + (b.x - 4.5), 0) / n : 0;
    const avgE = n ? samples.reduce((a,b) => a + (b.y - 4.5), 0) / n : 0;
    return { ...ev, n, avgP, avgE };
  });

  const kindColor = { work: '#6c7fff', focus: '#2e8b48', personal: '#e0b13a', wellness: '#4a76c6' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '40px 1fr 110px', gap: 14, alignItems: 'center',
          padding: '10px 14px',
          borderRadius: 14,
          background: 'var(--bg)',
          boxShadow: 'var(--neu-out-xs)',
        }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{String(r.hour).padStart(2,'0')}:00</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: kindColor[r.kind] }} />
            <span style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>×{r.n}</span>
          </div>
          <MoodPill p={r.avgP} e={r.avgE} />
        </div>
      ))}
    </div>
  );
}

function MoodPill({ p, e }) {
  const ratioP = (p + 5) / 10;
  const ratioE = (e + 5) / 10;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 999,
      background: 'var(--bg)', boxShadow: 'var(--neu-in)',
      fontSize: 11, fontFamily: 'JetBrains Mono',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#2e8b48', opacity: 0.4 + ratioP * 0.6 }} />
        <span style={{ color: 'var(--ink-soft)' }}>{p >= 0 ? '+' : ''}{p.toFixed(1)}</span>
      </span>
      <span style={{ color: 'var(--ink-faint)' }}>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#e85a4f', opacity: 0.4 + ratioE * 0.6 }} />
        <span style={{ color: 'var(--ink-soft)' }}>{e >= 0 ? '+' : ''}{e.toFixed(1)}</span>
      </span>
    </div>
  );
}

Object.assign(window, { LineChart, QuadrantDonut, HourDowHeat, TopWords, CalendarCorrelation, MoodPill });
