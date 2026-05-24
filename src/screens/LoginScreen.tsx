import { useState } from 'react';
import { NeuCard, NeuButton } from '../components/primitives';
import { useAuth } from '../lib/auth';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <NeuCard
        style={{
          width: 'min(420px, 92vw)',
          padding: 32,
          display: 'grid',
          gap: 22,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Mood Meter</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            Tu medidor personal. Inicia sesión para sincronizar tus registros entre dispositivos.
          </div>
        </div>

        <NeuButton onClick={onClick} disabled={busy} fullWidth size="lg" leadingIcon={<GoogleMark />}>
          {busy ? 'Redirigiendo…' : 'Continuar con Google'}
        </NeuButton>

        {err && (
          <div style={{ color: 'var(--q-red)', fontSize: 13, lineHeight: 1.4 }}>{err}</div>
        )}
      </NeuCard>
    </div>
  );
}
