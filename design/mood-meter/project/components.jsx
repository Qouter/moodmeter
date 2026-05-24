// Shared neumorphic primitives + MoodGrid component.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

function NeuCard({ children, inset, className = '', style, ...rest }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: inset ? 'var(--neu-in)' : 'var(--neu-out)',
        padding: 22,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function NeuButton({ children, onClick, variant = 'default', size = 'md', disabled, style, leadingIcon, fullWidth, type = 'button' }) {
  const [pressed, setPressed] = useState(false);
  const sizing = {
    sm: { padding: '8px 14px', fontSize: 13, borderRadius: 12 },
    md: { padding: '12px 20px', fontSize: 14.5, borderRadius: 14 },
    lg: { padding: '16px 28px', fontSize: 16, borderRadius: 18 },
  }[size];

  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
      style={{
        ...sizing,
        background: isPrimary ? 'linear-gradient(145deg, #7286ff, #5c70ee)' : 'var(--bg)',
        color: isPrimary ? '#fff' : (disabled ? 'var(--ink-faint)' : 'var(--ink)'),
        fontWeight: 600,
        letterSpacing: '-0.005em',
        boxShadow: isGhost
          ? 'none'
          : pressed
            ? (isPrimary ? 'inset 4px 4px 9px rgba(40,55,150,.45), inset -3px -3px 8px rgba(150,170,255,.4)' : 'var(--neu-in)')
            : (isPrimary ? '6px 6px 14px rgba(70,90,200,.35), -4px -4px 10px rgba(255,255,255,.7)' : 'var(--neu-out-sm)'),
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'box-shadow .14s ease, transform .14s ease',
        transform: pressed ? 'translateY(1px)' : 'translateY(0)',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
    >
      {leadingIcon}
      {children}
    </button>
  );
}

function NeuIconButton({ children, onClick, active, label, size = 44 }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      aria-label={label}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'var(--bg)',
        boxShadow: (pressed || active) ? 'var(--neu-in)' : 'var(--neu-out-sm)',
        color: active ? 'var(--ink)' : 'var(--ink-soft)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow .14s ease',
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, sublabel, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: accent || 'var(--ink)', lineHeight: 1 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{sublabel}</div>}
    </div>
  );
}

// --- MoodGrid ---
function MoodGrid({ selected, onSelect, size, heatmap, hideMarker, dense }) {
  const { cellColor, MOOD_LABELS, displayCoord, quadrant, quadrantMeta } = window.MoodData;
  const [hover, setHover] = useState(null);

  // 10x10 grid. UI rows top→bottom = y from 9→0.
  const rows = [];
  for (let yr = 0; yr < 10; yr++) {
    const y = 9 - yr;
    const cells = [];
    for (let x = 0; x < 10; x++) {
      const color = cellColor(x, y);
      const isSel = selected && selected.x === x && selected.y === y;
      const isHov = hover && hover.x === x && hover.y === y;
      let heatCount = 0;
      if (heatmap) {
        heatCount = heatmap[`${x},${y}`] || 0;
      }
      cells.push(
        <button
          data-cell={`${x},${y}`}
          key={`${x},${y}`}
          onMouseEnter={() => setHover({ x, y })}
          onMouseLeave={() => setHover(null)}
          onClick={() => onSelect && onSelect({ x, y, label: MOOD_LABELS[9 - y][x] })}
          aria-label={MOOD_LABELS[9 - y][x]}
          style={{
            background: color,
            border: 'none',
            borderRadius: isSel ? 8 : 4,
            cursor: onSelect ? 'pointer' : 'default',
            transition: 'transform .18s ease, box-shadow .18s ease, border-radius .18s ease',
            transform: isHov && onSelect ? 'scale(1.18)' : (isSel ? 'scale(1.06)' : 'scale(1)'),
            zIndex: isHov || isSel ? 5 : 1,
            boxShadow: isSel
              ? '0 6px 18px rgba(30,40,70,.35), inset 0 0 0 2.5px #ffffff'
              : isHov && onSelect
                ? '0 8px 22px rgba(30,40,70,.28)'
                : 'inset 0 0 0 1.2px rgba(255,255,255,.55)',
            position: 'relative',
            outline: 'none',
            padding: 0,
            minWidth: 0,
            minHeight: 0,
            width: '100%',
            height: '100%',
            aspectRatio: '1 / 1',
          }}
        >
          {heatmap && heatCount > 0 && (
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,.95)',
              textShadow: '0 1px 2px rgba(0,0,0,.4)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>{heatCount}</span>
          )}
        </button>
      );
    }
    rows.push(cells);
  }

  const hoverLabel = hover ? MOOD_LABELS[9 - hover.y][hover.x] : null;
  const selLabel = selected ? MOOD_LABELS[9 - selected.y][selected.x] : null;

  // Axis labels
  const xLabels = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  const innerSize = size || 'min(72vh, 560px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
      {/* Top row: axis hint only — no labels or coords on hover/select, to avoid biasing the user's own word. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 28, marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Energía ↑</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '0.04em', textAlign: 'right' }}>
          {onSelect ? 'Elige cómo te sientes' : '\u00A0'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', width: '100%' }}>
        {/* Y axis */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 0, paddingBottom: 0, color: 'var(--ink-mute)', fontSize: 11, width: 18, fontFamily: 'JetBrains Mono, monospace' }}>
          {[5,4,3,2,1,0,-1,-2,-3,-4,-5].map((v) => (
            <div key={v} style={{ height: 0, transform: 'translateY(-4px)' }}>{v}</div>
          ))}
        </div>

        {/* Grid surface */}
        <div
          className="neu-inset"
          style={{
            padding: 12,
            borderRadius: 20,
            flex: 1,
            aspectRatio: '1 / 1',
            maxWidth: innerSize,
            display: 'grid',
            gridTemplateRows: 'repeat(10, 1fr)',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 3,
            position: 'relative',
          }}
        >
          {rows.flat()}
        </div>
      </div>

      {/* X axis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingLeft: 26, color: 'var(--ink-mute)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
        {xLabels.map((v) => <div key={v}>{v}</div>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: 26, marginTop: 2 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>← desagradable   agradable →</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'JetBrains Mono, monospace' }}>Placer</div>
      </div>
    </div>
  );
}

// --- Bottom sheet ---
function BottomSheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          width: 'min(560px, 96vw)',
          marginBottom: 14,
          padding: 26,
          borderRadius: 26,
          boxShadow: '0 -10px 40px rgba(40,55,90,.25), var(--neu-out)',
          animation: 'slideUp .35s cubic-bezier(.2,.8,.2,1)',
          position: 'relative',
        }}
      >
        {/* drag handle */}
        <div style={{ width: 44, height: 5, borderRadius: 999, background: 'var(--shadow-dark)', margin: '0 auto 16px' }} />
        {title && <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// --- Icons (minimalist line) ---
const Icon = {
  Grid: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Chart: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-5"/></svg>,
  Clock: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  Cog: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.08-1.04l2.06-1.5-2-3.46-2.4.86A7 7 0 0 0 14.5 5l-.5-2.5h-4L9.5 5a7 7 0 0 0-2.08 1.86l-2.4-.86-2 3.46 2.06 1.5A7 7 0 0 0 5 12c0 .36.03.7.08 1.04l-2.06 1.5 2 3.46 2.4-.86A7 7 0 0 0 9.5 19l.5 2.5h4l.5-2.5a7 7 0 0 0 2.08-1.86l2.4.86 2-3.46-2.06-1.5c.05-.34.08-.68.08-1.04Z"/></svg>,
  Check: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l5 5L20 7"/></svg>,
  Close: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  Send: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>,
  Cal: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>,
  Bolt: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>,
  Plus: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  Bell: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>,
  Moon: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>,
  Spark: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"/></svg>,
  Arrow: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
};

Object.assign(window, { NeuCard, NeuButton, NeuIconButton, Stat, MoodGrid, BottomSheet, Icon });
