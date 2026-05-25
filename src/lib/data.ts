// Data layer: mood entries, mood labels, seed data, Supabase persistence.
// Coordinates: x (pleasantness) 0..9, y (energy) 0..9, both 0-indexed from bottom-left.
// Displayed scale -5..+5 (label at boundaries). Center value of cell = (x-4.5, y-4.5).

import { supabase } from './supabase';

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
}

export interface CalendarEvent {
  title: string;
  kind: 'work' | 'focus' | 'personal' | 'wellness';
  hour: number;
  durMin: number;
}

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

// Smooth bilinear interpolation across the four corner colors.
// Top-left = red (high-unpleasant), top-right = yellow (high-pleasant),
// bottom-right = green (low-pleasant), bottom-left = blue (low-unpleasant).
// Cells near the center are pulled toward a pale tone so the middle of the
// grid isn't a muddy brown.
export function cellColor(x: number, y: number): string {
  const TL: [number, number, number] = [184, 54, 44];
  const TR: [number, number, number] = [217, 168, 20];
  const BR: [number, number, number] = [46, 139, 72];
  const BL: [number, number, number] = [42, 77, 142];
  const PALE: [number, number, number] = [245, 244, 240];

  const u = x / 9;
  const v = y / 9;
  const w_bl = (1 - u) * (1 - v);
  const w_br = u * (1 - v);
  const w_tl = (1 - u) * v;
  const w_tr = u * v;

  const r = w_bl * BL[0] + w_br * BR[0] + w_tl * TL[0] + w_tr * TR[0];
  const g = w_bl * BL[1] + w_br * BR[1] + w_tl * TL[1] + w_tr * TR[1];
  const b = w_bl * BL[2] + w_br * BR[2] + w_tl * TL[2] + w_tr * TR[2];

  const dx = (x - 4.5) / 4.5;
  const dy = (y - 4.5) / 4.5;
  const distNorm = Math.min(1, Math.sqrt(dx * dx + dy * dy));
  const palePull = 0.45 * (1 - distNorm);

  const fr = Math.round(r + (PALE[0] - r) * palePull);
  const fg = Math.round(g + (PALE[1] - g) * palePull);
  const fb = Math.round(b + (PALE[2] - b) * palePull);
  return `rgb(${fr},${fg},${fb})`;
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

export interface UserSettings {
  name: string;
  mode: 'random' | 'fixed' | 'manual';
  pings_per_day: number;
  window_start: number;
  window_end: number;
  weekend_mode: 'same' | 'reduced' | 'off';
  night_silence: boolean;
  contextual: { wakeup: boolean; postEvent: boolean; inactivity: boolean };
  telegram_on: boolean;
  calendar_on: boolean;
  telegram_chat_id: string | null;
  telegram_link_token: string | null;
}

export const TELEGRAM_BOT_USERNAME = 'moodmeter_thebot';

export function generateLinkToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = 'MM-';
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i === 3) out += '-';
  }
  return out;
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('No hay sesión activa');
  return data.user.id;
}

export async function loadEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('id,t,x,y,word')
    .order('t', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    t: r.t as string,
    x: r.x as number,
    y: r.y as number,
    word: (r.word as string | null) ?? '',
  }));
}

export async function addEntry(entry: Entry): Promise<Entry[]> {
  const user_id = await currentUserId();
  const { error } = await supabase.from('mood_entries').insert({
    user_id,
    t: entry.t,
    x: entry.x,
    y: entry.y,
    word: entry.word,
  });
  if (error) throw error;
  return loadEntries();
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('mood_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function clearEntries(): Promise<void> {
  const user_id = await currentUserId();
  const { error } = await supabase.from('mood_entries').delete().eq('user_id', user_id);
  if (error) throw error;
}

export async function seedIfEmpty(): Promise<Entry[]> {
  const existing = await loadEntries();
  if (existing.length > 0) return existing;

  const user_id = await currentUserId();
  const now = new Date();
  const rows: Array<{ user_id: string; t: string; x: number; y: number; word: string }> = [];
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
      rows.push({
        user_id,
        t: t.toISOString(),
        x,
        y,
        word,
      });
    }
  }

  const { error } = await supabase.from('mood_entries').insert(rows);
  if (error) throw error;
  return loadEntries();
}

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  mode: 'random',
  pings_per_day: 4,
  window_start: 9,
  window_end: 22,
  weekend_mode: 'reduced',
  night_silence: true,
  contextual: { wakeup: true, postEvent: true, inactivity: false },
  telegram_on: false,
  calendar_on: false,
  telegram_chat_id: null,
  telegram_link_token: null,
};

export async function loadSettings(): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('name,mode,pings_per_day,window_start,window_end,weekend_mode,night_silence,contextual,telegram_on,calendar_on,telegram_chat_id,telegram_link_token')
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;
  return {
    name: (data.name as string) ?? '',
    mode: (data.mode as UserSettings['mode']) ?? 'random',
    pings_per_day: (data.pings_per_day as number) ?? 4,
    window_start: (data.window_start as number) ?? 9,
    window_end: (data.window_end as number) ?? 22,
    weekend_mode: (data.weekend_mode as UserSettings['weekend_mode']) ?? 'reduced',
    night_silence: (data.night_silence as boolean) ?? true,
    contextual: (data.contextual as UserSettings['contextual']) ?? DEFAULT_SETTINGS.contextual,
    telegram_on: (data.telegram_on as boolean) ?? false,
    calendar_on: (data.calendar_on as boolean) ?? false,
    telegram_chat_id: (data.telegram_chat_id as string | null) ?? null,
    telegram_link_token: (data.telegram_link_token as string | null) ?? null,
  };
}

export async function saveSettings(partial: Partial<UserSettings>): Promise<void> {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from('user_settings')
    .update({ ...partial, updated_at: new Date().toISOString() })
    .eq('user_id', user_id);
  if (error) throw error;
}

export const MOCK_CALENDAR: CalendarEvent[] = [
  { title: 'Reunión diaria', kind: 'work', hour: 9, durMin: 30 },
  { title: 'Foco · diseño', kind: 'focus', hour: 10, durMin: 120 },
  { title: 'Comida', kind: 'personal', hour: 14, durMin: 60 },
  { title: '1:1 con Marta', kind: 'work', hour: 16, durMin: 45 },
  { title: 'Gimnasio', kind: 'wellness', hour: 19, durMin: 60 },
];
