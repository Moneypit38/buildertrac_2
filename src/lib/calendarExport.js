// Helpers for putting a single task or appointment into Google / Apple calendars.

const ymd = (d) => d.replace(/-/g, "");
const nextDay = (d) => {
  const dt = new Date(d + "T12:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
};
const hm = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "").trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const stamp = (d, h, m) => `${ymd(d)}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Normalises a task or appointment into { title, date, start, end, location, details }.
export function toEvent(item, kind, projectName) {
  if (kind === "task") {
    return {
      id: `task-${item.id}`, title: `Task: ${item.title}`, date: item.due_date, start: null, end: null, location: "",
      details: [projectName && `Job: ${projectName}`, item.assigned_to && `Assigned to: ${item.assigned_to}`, item.description].filter(Boolean).join("\n"),
    };
  }
  return {
    id: `appt-${item.id}`, title: item.title, date: item.date, start: item.start_time || null, end: item.end_time || null,
    location: item.location || "",
    details: [projectName && `Job: ${projectName}`, item.attendees && `With: ${item.attendees}`, item.notes].filter(Boolean).join("\n"),
  };
}

function times(ev) {
  const s = hm(ev.start);
  if (!s) return { allDay: true, a: ymd(ev.date), b: nextDay(ev.date) };
  const e = hm(ev.end);
  const [h, m] = s;
  const [eh, em] = e && e[0] * 60 + e[1] > h * 60 + m ? e : [Math.min(h + 1, 23), h + 1 > 23 ? 59 : m];
  return { allDay: false, a: stamp(ev.date, h, m), b: stamp(ev.date, eh, em) };
}

export function googleUrl(ev) {
  const t = times(ev);
  const p = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates: `${t.a}/${t.b}` });
  if (ev.details) p.set("details", ev.details);
  if (ev.location) p.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function icsText(ev) {
  const t = times(ev);
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BuilderTrac//Calendar//EN", "BEGIN:VEVENT",
    `UID:${ev.id}@buildertrac`, `DTSTAMP:${now}`,
    t.allDay ? `DTSTART;VALUE=DATE:${t.a}` : `DTSTART:${t.a}`,
    t.allDay ? `DTEND;VALUE=DATE:${t.b}` : `DTEND:${t.b}`,
    `SUMMARY:${esc(ev.title)}`,
  ];
  if (ev.location) lines.push(`LOCATION:${esc(ev.location)}`);
  if (ev.details) lines.push(`DESCRIPTION:${esc(ev.details)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// Apple Calendar and others: hand the phone a .ics file. Uses the share sheet where the device has one
// (iPhone: choose Calendar), otherwise downloads the file.
export async function shareIcs(ev) {
  const file = new File([icsText(ev)], "event.ics", { type: "text/calendar" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: ev.title }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = "event.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
