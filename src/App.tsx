import { useEffect, useState } from 'react';
import { Icon } from './components/icons';
import { CheckInScreen } from './screens/CheckInScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { useAuth } from './lib/auth';
import {
  loadEntries,
  addEntry as addEntryStore,
  deleteEntry,
  clearEntries,
  seedIfEmpty,
  type Entry,
} from './lib/data';

type Tab = 'checkin' | 'insights' | 'history' | 'settings';

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'checkin', label: 'Registro', icon: <Icon.Grid /> },
  { id: 'insights', label: 'Insights', icon: <Icon.Chart /> },
  { id: 'history', label: 'Historial', icon: <Icon.Clock /> },
  { id: 'settings', label: 'Ajustes', icon: <Icon.Cog /> },
];

function Logo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        background: 'var(--bg)',
        boxShadow: 'var(--neu-out-sm)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'linear-gradient(145deg, #fdfffb 0%, #eaf3e6 100%)',
          boxShadow:
            '0 4px 10px rgba(120,160,110,.25), inset 0 0 0 1.2px rgba(255,255,255,.95), inset 0 -3px 6px rgba(150,185,140,.18)',
        }}
      />
    </div>
  );
}

export default function App() {
  const { session, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('checkin');
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!session) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fresh = await loadEntries();
        if (cancelled) return;
        setEntries(fresh);
      } catch (e) {
        console.error('No se pudieron cargar los registros:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>
        Cargando…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app">
        <LoginScreen />
      </div>
    );
  }

  const onAdd = async (e: Entry) => {
    const next = await addEntryStore(e);
    setEntries(next);
  };
  const onDelete = async (id: string) => {
    await deleteEntry(id);
    setEntries((cur) => cur.filter((e) => e.id !== id));
  };
  const onClear = async () => {
    if (!confirm('¿Borrar todas las entradas? Esto no se puede deshacer.')) return;
    await clearEntries();
    setEntries([]);
  };
  const onSeed = async () => {
    await clearEntries();
    const next = await seedIfEmpty();
    setEntries(next);
  };

  return (
    <div className="app">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>Mood Meter</div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--ink-mute)',
                letterSpacing: '0.04em',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Tu medidor personal · solo para ti
            </div>
          </div>
        </div>

        <nav className="navpill top" style={{ marginLeft: 'auto' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? 'active' : ''}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => signOut()}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          style={{
            background: 'var(--bg)',
            border: 'none',
            boxShadow: 'var(--neu-out-sm)',
            borderRadius: 12,
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: 'var(--ink-mute)',
          }}
        >
          <Icon.LogOut />
        </button>
      </header>

      <main>
        {tab === 'checkin' && <CheckInScreen entries={entries} onAdd={onAdd} />}
        {tab === 'insights' && <InsightsScreen entries={entries} />}
        {tab === 'history' && <HistoryScreen entries={entries} onDelete={onDelete} />}
        {tab === 'settings' && <SettingsScreen onClear={onClear} onSeed={onSeed} />}
      </main>

      <div className="bottomnav">
        <div
          className="navpill"
          style={{
            background: 'var(--bg)',
            boxShadow: '0 14px 36px rgba(40,55,90,.18), var(--neu-out)',
            padding: 6,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={tab === t.id ? 'active' : ''}
              style={{ padding: '10px 14px' }}
              aria-label={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
