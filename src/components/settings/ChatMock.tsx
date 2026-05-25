import type { ReactNode } from 'react';

function ChipBtn({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'var(--bg)',
        boxShadow: 'var(--neu-out-xs)',
        color: 'var(--ink-soft)',
      }}
    >
      {children}
    </span>
  );
}

export function ChatMock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #fdfffb 0%, #eaf3e6 100%)',
            boxShadow: '0 3px 8px rgba(120,160,110,.3), inset 0 0 0 1.2px rgba(255,255,255,.9)',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            background: 'var(--bg)',
            boxShadow: 'var(--neu-out-sm)',
            padding: '12px 14px',
            borderRadius: '14px 14px 14px 4px',
            maxWidth: 280,
            fontSize: 13.5,
            lineHeight: 1.5,
            color: 'var(--ink)',
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>moodmeter_thebot</div>
          ¿Cómo te encuentras ahora mismo? Abre el mapa para registrar tu estado.
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <ChipBtn>Abrir mapa</ChipBtn>
            <ChipBtn>Saltar</ChipBtn>
            <ChipBtn>Pausar 2h</ChipBtn>
          </div>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginLeft: 40 }}>
        14:15 · entregado
      </div>
    </div>
  );
}
