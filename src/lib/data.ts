// Data layer: mood entries, mood labels, mock seed data, mock services.
// Coordinates: x (pleasantness) 0..9, y (energy) 0..9, both 0-indexed from bottom-left.
// Displayed scale -5..+5 (label at boundaries). Center value of cell = (x-4.5, y-4.5).

export type Quadrant =
  | 'high-unpleasant'
  | 'high-pleasant'
  | 'low-unpleasant'
  | 'low-pleasant';

export interface Entry {
  id: string;
  t: string;
  x: number;
  y: number;
  word: string;
  label: string;
}

export interface CalendarEvent {
  title: string;
  kind: 'work' | 'focus' | 'personal' | 'wellness';
  hour: number;
  durMin: number;
}

const STORAGE_KEY = 'mood_meter_entries_v1';

// 10x10 labels — classic mood meter vocabulary, in Spanish. (x left→right, y bottom→top)
// Index: MOOD_LABELS[9 - y][x] for y from 0 (bottom) to 9 (top).
export const MOOD_LABELS: string[][] = [
  // y = 9 (top, most energy)
  ['Enfurecido', 'Pánico', 'Estresado', 'Acelerado', 'Conmocionado', 'Sorprendido', 'Animado', 'Festivo', 'Eufórico', 'Extasiado'],
  ['Iracundo', 'Furioso', 'Frustrado', 'Tenso', 'Atónito', 'Hiperactivo', 'Alegre', 'Motivado', 'Inspirado', 'Exultante'],
  ['Rabioso', 'Asustado', 'Enfadado', 'Nervioso', 'Inquieto', 'Enérgico', 'Vivaz', 'Emocionado', 'Optimista', 'Entusiasta'],
  ['Ansioso', 'Aprensivo', 'Preocupado', 'Irritado', 'Molesto', 'Complacido', 'Concentrado', 'Orgulloso', 'Encantado', 'Jubiloso'],
  ['Asqueado', 'Atribulado', 'Intranquilo', 'Desasosegado', 'Mosqueado', 'Agradable', 'Feliz', 'Confiado', 'Juguetón', 'Dichoso'],
  // y = 4
  ['Disgustado', 'Apagado', 'Decepcionado', 'Decaído', 'Apático', 'A gusto', 'Tranquilo', 'Contento', 'Cariñoso', 'Pleno'],
  ['Pesimista', 'Sombrío', 'Desanimado', 'Triste', 'Aburrido', 'Calmado', 'Seguro', 'Satisfecho', 'Agradecido', 'Conmovido'],
  ['Aislado', 'Abatido', 'Solo', 'Desalentado', 'Cansado', 'Relajado', 'Sosegado', 'Reposado', 'Bendecido', 'Equilibrado'],
  ['Desconsolado', 'Deprimido', 'Hosco', 'Agotado', 'Fatigado', 'Apacible', 'Reflexivo', 'En paz', 'Cómodo', 'Despreocupado'],
  ['Hundido', 'Sin esperanza', 'Desolado', 'Vacío', 'Drenado', 'Quieto', 'Acogido', 'Adormilado', 'Completo', 'Sereno'],
];

// Cell color per quadrant with intensity ramp.
export function cellColor(x: number, y: number): string {
  const right = x >= 5;
  const top = y >= 5;
  const dx = x - 4.5;
  const dy = y - 4.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(2 * 4.5 * 4.5);
  const t = dist / maxDist;

  const corner: [number, number, number] = top && !right
    ? [184, 54, 44]
    : top && right
      ? [217, 168, 20]
      : !top && right
        ? [46, 139, 72]
        : [42, 77, 142];

  const center: [number, number, number] = top && !right
    ? [244, 175, 167]
    : top && right
      ? [249, 232, 175]
      : !top && right
        ? [180, 224, 192]
        : [180, 198, 230];

  const mix = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
  const k = Math.min(1, t * 1.05);
  const out = [
    mix(center[0], corner[0], k),
    mix(center[1], corner[1], k),
    mix(center[2], corner[2], k),
  ];
  return `rgb(${out[0]},${out[1]},${out[2]})`;
}

export function quadrant(x: number, y: number): Quadrant {
  if (y >= 5 && x < 5) return 'high-unpleasant';
  if (y >= 5 && x >= 5) return 'high-pleasant';
  if (y < 5 && x < 5) return 'low-unpleasant';
  return 'low-pleasant';
}

export function quadrantMeta(q: Quadrant) {
  return {
    'high-unpleasant': { name: 'Alta energía · Desagradable', color: 'var(--q-red)', dot: '#e85a4f' },
    'high-pleasant': { name: 'Alta energía · Agradable', color: 'var(--q-yellow-d)', dot: '#e0b13a' },
    'low-unpleasant': { name: 'Baja energía · Desagradable', color: 'var(--q-blue)', dot: '#4a76c6' },
    'low-pleasant': { name: 'Baja energía · Agradable', color: 'var(--q-green-d)', dot: '#2e8b48' },
  }[q];
}

export function displayCoord(x: number, y: number) {
  return {
    pleasantness: +(x - 4.5).toFixed(1),
    energy: +(y - 4.5).toFixed(1),
  };
}

export function loadEntries(): Entry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Entry[];
  } catch {
    return null;
  }
}
export function saveEntries(arr: Entry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}
export function addEntry(entry: Entry): Entry[] {
  const cur = loadEntries() || [];
  const next = [...cur, entry].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  saveEntries(next);
  return next;
}
export function clearEntries(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function seedIfEmpty(): void {
  if (loadEntries()) return;
  const now = new Date();
  const entries: Entry[] = [];
  const wordsByQuad: Record<Quadrant, string[]> = {
    'high-unpleasant': ['agobio', 'prisa', 'tensión', 'frustración', 'enfado', 'ansiedad'],
    'high-pleasant': ['flow', 'foco', 'energía', 'chispa', 'motivado', 'optimismo', 'impulso'],
    'low-unpleasant': ['cansancio', 'vacío', 'melancolía', 'duda', 'bajón', 'flojo'],
    'low-pleasant': ['calma', 'paz', 'equilibrio', 'agradecido', 'sereno', 'relax', 'suave'],
  };

  for (let d = 20; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const hour = 8 + Math.floor((i + 1) * (12 / n)) + Math.floor(Math.random() * 2);
      const minute = Math.floor(Math.random() * 60);
      const t = new Date(day);
      t.setHours(hour, minute, 0, 0);

      const dow = t.getDay();
      const isWeekend = dow === 0 || dow === 6;
      let xCenter = isWeekend ? 6.5 : 4.8;
      const yCenter = hour < 11 ? 6 : hour < 16 ? 7 : 4;
      xCenter += (20 - d) * 0.05;
      const x = Math.max(0, Math.min(9, Math.round(xCenter + (Math.random() - 0.5) * 3)));
      const y = Math.max(0, Math.min(9, Math.round(yCenter + (Math.random() - 0.5) * 3)));
      const q = quadrant(x, y);
      const words = wordsByQuad[q];
      const word = words[Math.floor(Math.random() * words.length)];
      entries.push({
        id: Math.random().toString(36).slice(2, 10),
        t: t.toISOString(),
        x,
        y,
        word,
        label: MOOD_LABELS[9 - y][x],
      });
    }
  }
  saveEntries(entries);
}

export const MOCK_CALENDAR: CalendarEvent[] = [
  { title: 'Reunión diaria', kind: 'work', hour: 9, durMin: 30 },
  { title: 'Foco · diseño', kind: 'focus', hour: 10, durMin: 120 },
  { title: 'Comida', kind: 'personal', hour: 14, durMin: 60 },
  { title: '1:1 con Marta', kind: 'work', hour: 16, durMin: 45 },
  { title: 'Gimnasio', kind: 'wellness', hour: 19, durMin: 60 },
];
