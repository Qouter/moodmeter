import { useState } from 'react';
import { cellColor, MOOD_LABELS } from '../lib/data';

interface SelectedCell {
  x: number;
  y: number;
  label?: string;
}

interface MoodGridProps {
  selected?: SelectedCell | null;
  onSelect?: (cell: { x: number; y: number }) => void;
  size?: string;
  heatmap?: Record<string, number>;
}

export function MoodGrid({ selected, onSelect, size, heatmap }: MoodGridProps) {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const rows: JSX.Element[][] = [];
  for (let yr = 0; yr < 10; yr++) {
    const y = 9 - yr;
    const cells: JSX.Element[] = [];
    for (let x = 0; x < 10; x++) {
      const color = cellColor(x, y);
      const isSel = !!selected && selected.x === x && selected.y === y;
      const isHov = !!hover && hover.x === x && hover.y === y;
      let heatCount = 0;
      if (heatmap) heatCount = heatmap[`${x},${y}`] || 0;
      cells.push(
        <button
          data-cell={`${x},${y}`}
          key={`${x},${y}`}
          onMouseEnter={() => setHover({ x, y })}
          onMouseLeave={() => setHover(null)}
          onClick={() => onSelect && onSelect({ x, y })}
          aria-label={MOOD_LABELS[9 - y][x]}
          style={{
            background: color,
            border: 'none',
            borderRadius: isSel ? 8 : 4,
            cursor: onSelect ? 'pointer' : 'default',
            transition: 'transform .18s ease, box-shadow .18s ease, border-radius .18s ease',
            transform: isHov && onSelect ? 'scale(1.18)' : isSel ? 'scale(1.06)' : 'scale(1)',
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
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,.95)',
                textShadow: '0 1px 2px rgba(0,0,0,.4)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {heatCount}
            </span>
          )}
        </button>,
      );
    }
    rows.push(cells);
  }

  const innerSize = size || 'min(72vh, 560px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 28, marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Energía ↑</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '0.04em', textAlign: 'right' }}>
          {onSelect ? 'Elige cómo te sientes' : '\u00A0'}
        </div>
      </div>

      <div
        className="neu-inset"
        style={{
          padding: 12,
          borderRadius: 20,
          width: '100%',
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
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: '50%',
            height: 1.5,
            transform: 'translateY(-50%)',
            background: 'rgba(40,55,90,0.28)',
            pointerEvents: 'none',
            zIndex: 6,
            borderRadius: 1,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 12,
            bottom: 12,
            left: '50%',
            width: 1.5,
            transform: 'translateX(-50%)',
            background: 'rgba(40,55,90,0.28)',
            pointerEvents: 'none',
            zIndex: 6,
            borderRadius: 1,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 2 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          ← desagradable agradable →
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'JetBrains Mono, monospace' }}>Placer</div>
      </div>
    </div>
  );
}
