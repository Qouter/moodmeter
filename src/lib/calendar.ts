import { supabase } from './supabase';
import type { CalendarEvent } from './data';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

interface GCalEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
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

export async function fetchCalendarEventsForDay(date: Date): Promise<CalendarEvent[]> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.provider_token) throw new CalendarAuthError();

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const url = new URL(CALENDAR_API);
  url.searchParams.set('timeMin', dayStart.toISOString());
  url.searchParams.set('timeMax', dayEnd.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${session.provider_token}` },
  });

  if (res.status === 401 || res.status === 403) throw new CalendarAuthError();
  if (!res.ok) throw new Error(`Google Calendar API ${res.status}: ${await res.text()}`);

  const body = await res.json();
  const items: GCalEvent[] = body.items ?? [];

  return items
    .filter((it) => it.start?.dateTime && it.end?.dateTime)
    .map((it) => {
      const start = new Date(it.start!.dateTime!);
      const end = new Date(it.end!.dateTime!);
      const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
      return {
        title: it.summary?.trim() || 'Sin título',
        kind: classifyEventKind(it.summary ?? ''),
        hour: start.getHours() + start.getMinutes() / 60,
        durMin,
      };
    });
}
