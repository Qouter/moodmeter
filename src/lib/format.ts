export function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
export function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
export function shortDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ScheduleParams {
  mode: 'random' | 'fixed' | 'manual';
  pingsPerDay: number;
  windowStart: number;
  windowEnd: number;
}

export function computeSchedule({ mode, pingsPerDay, windowStart, windowEnd }: ScheduleParams, dateSeed: number): number[] {
  if (mode === 'manual' || pingsPerDay <= 0) return [];
  const span = Math.max(0.5, windowEnd - windowStart);
  if (mode === 'fixed') {
    const step = span / pingsPerDay;
    return Array.from({ length: pingsPerDay }, (_, i) => windowStart + step * (i + 0.5));
  }
  const rng = mulberry32(dateSeed);
  const minGap = Math.max(0.75, Math.min(2, span / (pingsPerDay + 1.2)));
  for (let attempts = 0; attempts < 80; attempts++) {
    const times = Array.from({ length: pingsPerDay }, () => windowStart + rng() * span).sort((a, b) => a - b);
    let ok = true;
    for (let i = 1; i < times.length; i++) {
      if (times[i] - times[i - 1] < minGap) {
        ok = false;
        break;
      }
    }
    if (ok) return times;
  }
  const step = span / pingsPerDay;
  return Array.from({ length: pingsPerDay }, (_, i) => windowStart + step * (i + 0.5) + (rng() - 0.5) * 0.4);
}
