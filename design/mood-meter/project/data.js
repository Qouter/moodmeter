// Data layer: mood entries, mood labels, mock seed data, mock services.
// Coordinates: x (pleasantness) 0..9, y (energy) 0..9, both 0-indexed from bottom-left.
// Displayed scale -5..+5 (label at boundaries). Center value of cell = (x-4.5, y-4.5).

(function () {
  const STORAGE_KEY = 'mood_meter_entries_v1';

  // 10x10 labels — vocabulario clásico del mood meter, en español. (x izda→dcha, y abajo→arriba)
  // Índice: MOOD_LABELS[y][x] con y=0 abajo, y=9 arriba.
  const MOOD_LABELS = [
    // y = 9 (más energía)
    ['Enfurecido','Pánico','Estresado','Acelerado','Conmocionado', 'Sorprendido','Animado','Festivo','Eufórico','Extasiado'],
    ['Iracundo','Furioso','Frustrado','Tenso','Atónito',           'Hiperactivo','Alegre','Motivado','Inspirado','Exultante'],
    ['Rabioso','Asustado','Enfadado','Nervioso','Inquieto',         'Enérgico','Vivaz','Emocionado','Optimista','Entusiasta'],
    ['Ansioso','Aprensivo','Preocupado','Irritado','Molesto',       'Complacido','Concentrado','Orgulloso','Encantado','Jubiloso'],
    ['Asqueado','Atribulado','Intranquilo','Desasosegado','Mosqueado', 'Agradable','Feliz','Confiado','Juguetón','Dichoso'],
    // y = 4
    ['Disgustado','Apagado','Decepcionado','Decaído','Apático',     'A gusto','Tranquilo','Contento','Cariñoso','Pleno'],
    ['Pesimista','Sombrío','Desanimado','Triste','Aburrido',        'Calmado','Seguro','Satisfecho','Agradecido','Conmovido'],
    ['Aislado','Abatido','Solo','Desalentado','Cansado',            'Relajado','Sosegado','Reposado','Bendecido','Equilibrado'],
    ['Desconsolado','Deprimido','Hosco','Agotado','Fatigado',       'Apacible','Reflexivo','En paz','Cómodo','Despreocupado'],
    ['Hundido','Sin esperanza','Desolado','Vacío','Drenado',        'Quieto','Acogido','Adormilado','Completo','Sereno'],
  ];

  // Cell color per quadrant with intensity ramp. Returns rgb string.
  function cellColor(x, y) {
    // x: 0..9, y: 0..9
    const right = x >= 5;
    const top   = y >= 5;
    // Distance from center (4.5, 4.5) — fade toward white near center
    const dx = x - 4.5;
    const dy = y - 4.5;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = Math.sqrt(2 * 4.5 * 4.5);
    const t = dist / maxDist; // 0 center → 1 corner

    let base;
    if (top && !right)  base = [232, 90, 79];   // red    (top-left)
    else if (top && right) base = [244, 201, 71]; // yellow (top-right)
    else if (!top && right) base = [92, 184, 114]; // green (bot-right)
    else                   base = [74, 118, 198]; // blue  (bot-left)

    // Make corners deeper for red/blue; brighter for yellow/green
    const corner = top && !right ? [184, 54, 44]
                 : top && right ? [217, 168, 20]
                 : !top && right ? [46, 139, 72]
                 : [42, 77, 142];

    // toward center: lighten toward soft pale tone
    const center = top && !right ? [244, 175, 167]
                 : top && right ? [249, 232, 175]
                 : !top && right ? [180, 224, 192]
                 : [180, 198, 230];

    const mix = (a, b, k) => Math.round(a + (b - a) * k);
    // k=0 at center (t=0), k=1 at corner (t=1). For visual reproduction of original.
    const k = Math.min(1, t * 1.05);
    const out = [
      mix(center[0], corner[0], k),
      mix(center[1], corner[1], k),
      mix(center[2], corner[2], k),
    ];
    return `rgb(${out[0]},${out[1]},${out[2]})`;
  }

  function quadrant(x, y) {
    if (y >= 5 && x < 5) return 'high-unpleasant'; // red
    if (y >= 5 && x >= 5) return 'high-pleasant';  // yellow
    if (y < 5 && x < 5) return 'low-unpleasant';   // blue
    return 'low-pleasant';                          // green
  }

  function quadrantMeta(q) {
    return ({
      'high-unpleasant': { name: 'Alta energía · Desagradable', color: 'var(--q-red)', dot: '#e85a4f' },
      'high-pleasant':   { name: 'Alta energía · Agradable',    color: 'var(--q-yellow-d)', dot: '#e0b13a' },
      'low-unpleasant':  { name: 'Baja energía · Desagradable', color: 'var(--q-blue)', dot: '#4a76c6' },
      'low-pleasant':    { name: 'Baja energía · Agradable',    color: 'var(--q-green-d)', dot: '#2e8b48' },
    })[q];
  }

  // Map cell → display values (-5..+5 center)
  function displayCoord(x, y) {
    return {
      pleasantness: +(x - 4.5).toFixed(1), // -4.5 .. +4.5
      energy: +(y - 4.5).toFixed(1),
    };
  }

  // ----- LocalStorage CRUD -----
  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }
  function saveEntries(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
  }
  function addEntry(entry) {
    const cur = loadEntries() || [];
    const next = [...cur, entry].sort((a,b) => new Date(a.t) - new Date(b.t));
    saveEntries(next);
    return next;
  }
  function clearEntries() { localStorage.removeItem(STORAGE_KEY); }

  // ----- Seed (3 weeks of plausible data) -----
  function seedIfEmpty() {
    if (loadEntries()) return;
    const now = new Date();
    const entries = [];
    const wordsByQuad = {
      'high-unpleasant': ['agobio','prisa','tensión','frustración','enfado','ansiedad'],
      'high-pleasant':   ['flow','foco','energía','chispa','motivado','optimismo','impulso'],
      'low-unpleasant':  ['cansancio','vacío','melancolía','duda','bajón','flojo'],
      'low-pleasant':    ['calma','paz','equilibrio','agradecido','sereno','relax','suave'],
    };

    for (let d = 20; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);
      // 3-5 check-ins per day
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const hour = 8 + Math.floor((i+1) * (12 / n)) + Math.floor(Math.random()*2);
        const minute = Math.floor(Math.random() * 60);
        const t = new Date(day);
        t.setHours(hour, minute, 0, 0);

        // Bias mood by time of day + day of week + slight upward trend
        const dow = t.getDay();
        const isWeekend = dow === 0 || dow === 6;
        let xCenter = isWeekend ? 6.5 : 4.8;     // weekends more pleasant
        let yCenter = hour < 11 ? 6 : hour < 16 ? 7 : 4; // afternoons energized, evenings calmer
        // Slight upward trend over the 3 weeks
        xCenter += (20 - d) * 0.05;
        // Add noise
        const x = Math.max(0, Math.min(9, Math.round(xCenter + (Math.random() - 0.5) * 3)));
        const y = Math.max(0, Math.min(9, Math.round(yCenter + (Math.random() - 0.5) * 3)));
        const q = quadrant(x, y);
        const words = wordsByQuad[q];
        const word = words[Math.floor(Math.random() * words.length)];
        entries.push({
          id: Math.random().toString(36).slice(2,10),
          t: t.toISOString(),
          x, y,
          word,
          label: MOOD_LABELS[9 - y][x],
        });
      }
    }
    saveEntries(entries);
  }

  // ----- Mock eventos de Google Calendar para correlación -----
  const MOCK_CALENDAR = [
    { title: 'Reunión diaria', kind: 'work', hour: 9, durMin: 30 },
    { title: 'Foco · diseño', kind: 'focus', hour: 10, durMin: 120 },
    { title: 'Comida', kind: 'personal', hour: 14, durMin: 60 },
    { title: '1:1 con Marta', kind: 'work', hour: 16, durMin: 45 },
    { title: 'Gimnasio', kind: 'wellness', hour: 19, durMin: 60 },
  ];

  // Export globals
  window.MoodData = {
    MOOD_LABELS,
    cellColor,
    quadrant,
    quadrantMeta,
    displayCoord,
    loadEntries,
    saveEntries,
    addEntry,
    clearEntries,
    seedIfEmpty,
    MOCK_CALENDAR,
  };
})();
