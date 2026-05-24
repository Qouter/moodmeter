import type { ReactNode } from 'react';

interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
}
export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 56,
        height: 32,
        borderRadius: 999,
        background: 'var(--bg)',
        boxShadow: on
          ? 'inset 3px 3px 6px rgba(80,100,200,.35), inset -3px -3px 6px rgba(255,255,255,.6)'
          : 'var(--neu-in)',
        position: 'relative',
        transition: 'all .25s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: on ? 28 : 4,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: on ? 'linear-gradient(145deg,#7286ff,#5c70ee)' : 'var(--bg)',
          boxShadow: on ? '0 3px 8px rgba(80,100,200,.4)' : 'var(--neu-out-sm)',
          transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
        }}
      />
    </button>
  );
}

interface LabelProps {
  children: ReactNode;
  right?: ReactNode;
}
export function Label({ children, right }: LabelProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
      </div>
      {right}
    </div>
  );
}

interface SegmentedOption<V extends string> {
  v: V;
  l: string;
  s?: string;
}
interface SegmentedProps<V extends string> {
  value: V;
  onChange: (v: V) => void;
  options: SegmentedOption<V>[];
  size?: 'sm' | 'md';
}
export function Segmented<V extends string>({ value, onChange, options, size }: SegmentedProps<V>) {
  const isLg = size !== 'sm';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 6,
        padding: 6,
        borderRadius: 16,
        background: 'var(--bg)',
        boxShadow: 'var(--neu-in)',
      }}
    >
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              padding: isLg ? '12px 10px' : '9px 10px',
              borderRadius: 12,
              background: active ? 'var(--bg)' : 'transparent',
              boxShadow: active ? 'var(--neu-out-sm)' : 'none',
              color: active ? 'var(--ink)' : 'var(--ink-mute)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              transition: 'all .22s ease',
            }}
          >
            <span style={{ fontSize: isLg ? 13.5 : 12.5, fontWeight: 700 }}>{o.l}</span>
            {o.s && (
              <span
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-mute)',
                  fontWeight: 500,
                  letterSpacing: '0',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {o.s}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SliderRowProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  markers?: number[];
}
export function SliderRow({ min, max, value, onChange, markers }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', paddingTop: 8 }}>
      <div
        style={{
          position: 'relative',
          height: 10,
          borderRadius: 999,
          background: 'var(--bg)',
          boxShadow: 'var(--neu-in)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--accent-soft), var(--accent))',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `calc(${pct}% - 11px)`,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #fff, #e6e9f0)',
            boxShadow: '0 4px 10px rgba(40,55,90,.25), inset 0 0 0 2px var(--bg)',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {markers && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 10.5,
            color: 'var(--ink-faint)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {markers.map((m) => (
            <span key={m} style={{ color: m === value ? 'var(--accent)' : 'inherit', fontWeight: m === value ? 700 : 500 }}>
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface TimeRangeProps {
  start: number;
  end: number;
  onChange: (s: number, e: number) => void;
}
export function TimeRange({ start, end, onChange }: TimeRangeProps) {
  const min = 0,
    max = 24,
    step = 0.5,
    gap = 1;
  const leftPct = (start / max) * 100;
  const rightPct = (end / max) * 100;
  return (
    <div style={{ position: 'relative', height: 28 }}>
      <div
        style={{
          position: 'absolute',
          top: 11,
          left: 0,
          right: 0,
          height: 8,
          borderRadius: 999,
          background: 'var(--bg)',
          boxShadow: 'var(--neu-in)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 11,
          left: `${leftPct}%`,
          width: `${rightPct - leftPct}%`,
          height: 8,
          borderRadius: 999,
          background: 'linear-gradient(90deg, var(--accent-soft), var(--accent))',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={start}
        onChange={(e) => {
          const v = Math.min(parseFloat(e.target.value), end - gap);
          onChange(v, end);
        }}
        className="tr-input"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={end}
        onChange={(e) => {
          const v = Math.max(parseFloat(e.target.value), start + gap);
          onChange(start, v);
        }}
        className="tr-input"
      />
      <div
        style={{
          position: 'absolute',
          top: 1,
          left: `calc(${leftPct}% - 14px)`,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #fff, #e6e9f0)',
          boxShadow: '0 4px 10px rgba(40,55,90,.25), inset 0 0 0 2px var(--bg)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1,
          left: `calc(${rightPct}% - 14px)`,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #fff, #e6e9f0)',
          boxShadow: '0 4px 10px rgba(40,55,90,.25), inset 0 0 0 2px var(--bg)',
          pointerEvents: 'none',
        }}
      />
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

interface ToggleRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}
export function ToggleRow({ icon, title, subtitle, on, onChange }: ToggleRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {icon && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--bg)',
            boxShadow: 'var(--neu-out-sm)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-soft)',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.4, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

interface MiniToggleProps {
  title: string;
  subtitle?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}
export function MiniToggle({ title, subtitle, on, onChange, disabled }: MiniToggleProps) {
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

interface MiniSwitchProps {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}
export function MiniSwitch({ on, onChange, disabled }: MiniSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: 'var(--bg)',
        boxShadow: on
          ? 'inset 2px 2px 5px rgba(80,100,200,.35), inset -2px -2px 5px rgba(255,255,255,.6)'
          : 'var(--neu-in)',
        position: 'relative',
        transition: 'all .25s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: on ? 'linear-gradient(145deg,#7286ff,#5c70ee)' : 'var(--bg)',
          boxShadow: on ? '0 2px 5px rgba(80,100,200,.4)' : 'var(--neu-out-xs)',
          transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
        }}
      />
    </button>
  );
}

interface SettingRowProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}
export function SettingRow({ title, subtitle, children }: SettingRowProps) {
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
