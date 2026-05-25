import { supabase } from './supabase';
import type { CalendarEvent } from './data';

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

interface GCalEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface GCalListEntry {
  id: string;
  summary?: string;
  selected?: boolean;
  accessRole?: string;
  primary?: boolean;
}

function classifyEventKind(title: string): CalendarEvent['kind'] {
  const t = title.toLowerCase();
  if (/gym|gimnasio|yoga|run|running|deporte|meditac|cardio|piscin|paseo/.test(t)) return 'wellness';
  if (/comid|cena|desayun|almuerzo|cumple|familia|amig|cita|cafe|café/.test(t)) return 'personal';
  if (/foco|focus|deep\s*work|concentra/.test(t)) return 'focus';
  return 'work';
}

export class CalendarAuthError extends Error {
  constructor() {
    super('Google Calendar token missing or expired. Re-authentication required.');
    this.name = 'CalendarAuthError';
  }
}

async function getProviderToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.provider_token;
  if (!token) throw new CalendarAuthError();
  return token;
}

async function gcalGet<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${CALENDAR_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new CalendarAuthError();
  if (!res.ok) throw new Error(`Google Calendar API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function listCalendars(token: string): Promise<GCalListEntry[]> {
  const body = await gcalGet<{ items?: GCalListEntry[] }>(token, '/users/me/calendarList', {
    minAccessRole: 'reader',
    showHidden: 'false',
  });
  return (body.items ?? []).filter((c) => c.selected !== false);
}

async function fetchEventsForCalendar(token: string, calendarId: string, timeMin: string, timeMax: string): Promise<GCalEvent[]> {
  const body = await gcalGet<{ items?: GCalEvent[] }>(token, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });
  return body.items ?? [];
}

export async function fetchCalendarEventsForDay(date: Date): Promise<CalendarEvent[]> {
  const token = await getProviderToken();

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const timeMin = dayStart.toISOString();
  const timeMax = dayEnd.toISOString();

  const calendars = await listCalendars(token);

  const results = await Promise.allSettled(
    calendars.map((c) => fetchEventsForCalendar(token, c.id, timeMin, timeMax)),
  );

  const events: CalendarEvent[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const it of r.value) {
      if (!it.start?.dateTime || !it.end?.dateTime) continue;
      const start = new Date(it.start.dateTime);
      const end = new Date(it.end.dateTime);
      events.push({
        title: it.summary?.trim() || 'Sin título',
        kind: classifyEventKind(it.summary ?? ''),
        hour: start.getHours() + start.getMinutes() / 60,
        durMin: Math.round((end.getTime() - start.getTime()) / 60000),
      });
    }
  }
  events.sort((a, b) => a.hour - b.hour);
  return events;
}
