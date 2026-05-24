// Root app: nav, state, mounts the screens. Loads after all other scripts.

const { useState: uSA, useEffect: uEA, useMemo: uMA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bgTone": "neutral",
  "accent": "indigo"
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = uSA('checkin');
  const [entries, setEntries] = uSA([]);

  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks via CSS vars
  uEA(() => {
    const root = document.documentElement;
    const tones = {
      neutral: { bg: '#e6e9f0', dark: '#b8bfcc', darker: '#a8b0bf' },
      warm:    { bg: '#ede8e0', dark: '#cabfa9', darker: '#b8ad97' },
      cool:    { bg: '#e1e7ef', dark: '#a8b6c6', darker: '#94a3b8' },
      mint:    { bg: '#e3ece6', dark: '#aebfb4', darker: '#9aaea1' },
    };
    const t = tones[tweaks.bgTone] || tones.neutral;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--shadow-dark', t.dark);
    root.style.setProperty('--shadow-darker', t.darker);

    const accents = {
      indigo: { a: '#6c7fff', s: '#aeb8ff' },
      coral:  { a: '#f0744d', s: '#f9b9a3' },
      teal:   { a: '#3aa9a3', s: '#9ed8d4' },
      lilac:  { a: '#9b6cff', s: '#cfb6ff' },
    };
    const ac = accents[tweaks.accent] || accents.indigo;
    root.style.setProperty('--accent', ac.a);
    root.style.setProperty('--accent-soft', ac.s);
  }, [tweaks.bgTone, tweaks.accent]);

  // Init
  uEA(() => {
    window.MoodData.seedIfEmpty();
    setEntries(window.MoodData.loadEntries() || []);
  }, []);

  const onAdd = (e) => {
    const next = window.MoodData.addEntry(e);
    setEntries(next);
  };
  const onDelete = (id) => {
    const next = (window.MoodData.loadEntries() || []).filter((e) => e.id !== id);
    window.MoodData.saveEntries(next);
    setEntries(next);
  };
  const onClear = () => {
    if (!confirm('¿Borrar todas las entradas? Esto no se puede deshacer.')) return;
    window.MoodData.clearEntries();
    setEntries([]);
  };
  const onSeed = () => {
    window.MoodData.clearEntries();
    window.MoodData.seedIfEmpty();
    setEntries(window.MoodData.loadEntries() || []);
  };

  const lastEntry = entries.length ? entries[entries.length - 1] : null;

  const tabs = [
    { id: 'checkin', label: 'Registro', icon: <Icon.Grid /> },
    { id: 'insights', label: 'Insights', icon: <Icon.Chart /> },
    { id: 'history', label: 'Historial', icon: <Icon.Clock /> },
    { id: 'settings', label: 'Ajustes', icon: <Icon.Cog /> },
  ];

  return (
    <div className="app" data-screen-label={tabs.find(t => t.id === tab)?.label}>
      {/* Top header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>Mood Meter</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', letterSpacing: '0.04em', fontWeight: 500, whiteSpace: 'nowrap' }}>Tu medidor personal · solo para ti</div>
          </div>
        </div>

        <nav className="navpill top" style={{ marginLeft: 'auto' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? 'active' : ''}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Screen content */}
      <main>
        {tab === 'checkin'  && <CheckInScreen entries={entries} onAdd={onAdd} lastEntry={lastEntry} />}
        {tab === 'insights' && <InsightsScreen entries={entries} />}
        {tab === 'history'  && <HistoryScreen entries={entries} onDelete={onDelete} />}
        {tab === 'settings' && <SettingsScreen onClear={onClear} onSeed={onSeed} />}
      </main>

      {/* Floating bottom nav (mobile) */}
      <div className="bottomnav">
        <div className="navpill" style={{ background: 'var(--bg)', boxShadow: '0 14px 36px rgba(40,55,90,.18), var(--neu-out)', padding: 6 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? 'active' : ''} style={{ padding: '10px 14px' }}>
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Apariencia">
          <TweakRadio
            label="Tono"
            value={tweaks.bgTone}
            onChange={(v) => setTweak('bgTone', v)}
            options={[
              { value: 'neutral', label: 'Neutro' },
              { value: 'warm', label: 'Cálido' },
              { value: 'cool', label: 'Frío' },
              { value: 'mint', label: 'Menta' },
            ]}
          />
          <TweakColor
            label="Acento"
            value={tweaks.accent}
            onChange={(v) => setTweak('accent', v)}
            options={[
              { value: 'indigo', color: '#6c7fff' },
              { value: 'coral',  color: '#f0744d' },
              { value: 'teal',   color: '#3aa9a3' },
              { value: 'lilac',  color: '#9b6cff' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function Logo() {
  // Minimal mark: a single "selected cell" — white with a subtle green tint.
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 14,
      background: 'var(--bg)',
      boxShadow: 'var(--neu-out-sm)',
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: 'linear-gradient(145deg, #fdfffb 0%, #eaf3e6 100%)',
        boxShadow:
          '0 4px 10px rgba(120,160,110,.25), ' +
          'inset 0 0 0 1.2px rgba(255,255,255,.95), ' +
          'inset 0 -3px 6px rgba(150,185,140,.18)',
      }} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
