import { cellColor } from '../../lib/data';

interface MoodPillProps {
  p: number;
  e: number;
}

export function MoodPill({ p, e }: MoodPillProps) {
  const x = Math.max(0, Math.min(9, Math.round(p + 4.5)));
  const y = Math.max(0, Math.min(9, Math.round(e + 4.5)));
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 44,
        height: 14,
        borderRadius: 999,
        background: cellColor(x, y),
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.6), 0 2px 4px rgba(40,55,90,.18)',
      }}
    />
  );
}
