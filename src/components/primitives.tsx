import { useState, type CSSProperties, type ReactNode, type HTMLAttributes } from 'react';

interface NeuCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  inset?: boolean;
}
export function NeuCard({ children, inset, className = '', style, ...rest }: NeuCardProps) {
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

interface NeuButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: CSSProperties;
  leadingIcon?: ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}
export function NeuButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled,
  style,
  leadingIcon,
  fullWidth,
  type = 'button',
}: NeuButtonProps) {
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
        color: isPrimary ? '#fff' : disabled ? 'var(--ink-faint)' : 'var(--ink)',
        fontWeight: 600,
        letterSpacing: '-0.005em',
        boxShadow: isGhost
          ? 'none'
          : pressed
            ? isPrimary
              ? 'inset 4px 4px 9px rgba(40,55,150,.45), inset -3px -3px 8px rgba(150,170,255,.4)'
              : 'var(--neu-in)'
            : isPrimary
              ? '6px 6px 14px rgba(70,90,200,.35), -4px -4px 10px rgba(255,255,255,.7)'
              : 'var(--neu-out-sm)',
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

interface StatProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  accent?: string;
}
export function Stat({ label, value, sublabel, accent }: StatProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: accent || 'var(--ink)', lineHeight: 1 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{sublabel}</div>}
    </div>
  );
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}
export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
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
        <div style={{ width: 44, height: 5, borderRadius: 999, background: 'var(--shadow-dark)', margin: '0 auto 16px' }} />
        {title && <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
