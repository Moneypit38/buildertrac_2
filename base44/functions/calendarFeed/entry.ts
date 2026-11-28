import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Calendar subscription feed (.ics) for Google Calendar, Apple Calendar and others.
//
// GET ?token=<48 hex>  ->  the owner's tasks (with due dates, not done) and appointments.
// The token comes from a CalendarFeed record that only its owner can read, so the link works like
// a private password. Resetting the link in the app deletes the record and the old link stops working.
// Read-only: nothing here can change any data.

const TOKEN_RE = /^[a-f0-9]{32,128}$/;

const esc = (s: unknown) =>
  String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Lines longer than 75 characters must be folded.
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
};

const ymd = (d: string) => d.replace(/-/g, '');
const nextDay = (d: string) => {
  const dt = new Date(d + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10).replace(/-/g, '');
};
const parseTime = (t: unknown): [number, number] | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  return h < 24 && mi < 60 ? [h, mi] : null;
};
const stamp = (d: string, h: number, m: number) => `${ymd(d)}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get('token') || '').trim().toLowerCase();
    if (!TOKEN_RE.test(token)) return new Response('Not found', { status: 404 });

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const feed = (await db.CalendarFeed.filter({ token }))?.[0];
    const ownerId = feed?.created_by_id;
    if (!feed || !ownerId) return new Response('Not found', { status: 404 });

    const [tasks, appts, projects] = await Promise.all([
      db.Task.list('-created_date', 2000),
      db.Appointment.list('-created_date', 2000),
      db.Project.list('-created_date', 1000),
    ]);
    const mine = (r: any) => r && (r.created_by_id === ownerId || r.owner_id === ownerId);
    const projName: Record<string, string> = {};
    projects.filter(mine).forEach((p: any) => { projName[p.id] = p.name; });

    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BuilderTrac//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:BuilderTrac',
      'X-PUBLISHED-TTL:PT1H',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    ];

    for (const a of appts.filter(mine)) {
      if (!a.date) continue;
      const start = parseTime(a.start_time);
      const end = parseTime(a.end_time);
      lines.push('BEGIN:VEVENT', `UID:appt-${a.id}@buildertrac`, `DTSTAMP:${now}`);
      if (start) {
        // Floating local time, so it shows at the same clock time wherever the phone is.
        const [h, m] = start;
        const [eh, em] = end && (end[0] * 60 + end[1] > h * 60 + m) ? end : [Math.min(h + 1, 23), h + 1 > 23 ? 59 : m];
        lines.push(`DTSTART:${stamp(a.date, h, m)}`, `DTEND:${stamp(a.date, eh, em)}`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${ymd(a.date)}`, `DTEND;VALUE=DATE:${nextDay(a.date)}`);
      }
      lines.push(`SUMMARY:${esc(a.title)}`);
      if (a.location) lines.push(`LOCATION:${esc(a.location)}`);
      const desc = [projName[a.project_id] && `Job: ${projName[a.project_id]}`, a.attendees && `With: ${a.attendees}`, a.notes].filter(Boolean).join('\n');
      if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
      lines.push('END:VEVENT');
    }

    for (const t of tasks.filter(mine)) {
      if (!t.due_date || t.completed || t.status === 'Done' || t.parent_task_id) continue;
      lines.push(
        'BEGIN:VEVENT', `UID:task-${t.id}@buildertrac`, `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${ymd(t.due_date)}`, `DTEND;VALUE=DATE:${nextDay(t.due_date)}`,
        `SUMMARY:${esc('Task: ' + t.title)}`,
      );
      const desc = [projName[t.project_id] && `Job: ${projName[t.project_id]}`, t.assigned_to && `Assigned to: ${t.assigned_to}`, t.status && `Status: ${t.status}`, t.description].filter(Boolean).join('\n');
      if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
      lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return new Response(lines.map(fold).join('\r\n') + '\r\n', {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="buildertrac.ics"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('calendarFeed error', err);
    return new Response('Error', { status: 500 });
  }
});
