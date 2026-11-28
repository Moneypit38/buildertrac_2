// Follow-up reminder rules. Defaults follow common contractor practice
// (first follow-up 2-3 days after an estimate, again around a week to ten days, a final one near two weeks).
const DAY = 86400000;

// "Planning" jobs are treated as estimates out: days after the job was created.
export const ESTIMATE_STEPS = [3, 10, 14];
export const ESTIMATE_STOP_DAYS = 21; // stop nagging after this
// Days of silence before a reminder, by status.
export const QUIET_DAYS = { "In Progress": 7, "On Hold": 14, "Completed": 90 };
const MIN_GAP_DAYS = 2; // never remind within 2 days of the last contact

const when = (e) => new Date(e.occurred_at || e.created_date).getTime();

// The follow-up plan for one job, due or not yet. null when reminders don't apply.
export function planFor(project, entries, now = Date.now()) {
  if (!project || project.follow_up_off || project.__token) return null;
  if (project.follow_up_snoozed_until && new Date(`${project.follow_up_snoozed_until}T23:59:59`).getTime() > now) return null;

  const times = entries.filter((e) => e.project_id === project.id).map(when).filter((n) => !isNaN(n)).sort((a, b) => b - a);
  const last = times.length ? times[0] : null;
  const created = new Date(project.created_date).getTime();
  if (isNaN(created)) return null;
  const status = project.status || "Planning";

  let dueAt;
  let step = 0;
  if (status === "Planning") {
    if (now > created + ESTIMATE_STOP_DAYS * DAY) return null;
    step = times.length; // contacts so far decides which follow-up is next
    if (step >= ESTIMATE_STEPS.length) return null;
    dueAt = created + ESTIMATE_STEPS[step] * DAY;
    if (last) dueAt = Math.max(dueAt, last + MIN_GAP_DAYS * DAY);
  } else {
    const gap = QUIET_DAYS[status];
    if (!gap) return null;
    const baseline = last ?? new Date(project.updated_date || project.created_date).getTime();
    dueAt = baseline + gap * DAY;
  }
  const since = last ?? created;
  return { project, status, step, dueAt, isDue: dueAt <= now, hasContact: last !== null, daysSince: Math.max(0, Math.floor((now - since) / DAY)) };
}

export function followUpFor(project, entries, now = Date.now()) {
  const p = planFor(project, entries, now);
  return p && p.isDue ? p : null;
}

export function computeFollowUps(projects, entries, now = Date.now()) {
  return projects.map((p) => followUpFor(p, entries, now)).filter(Boolean).sort((a, b) => a.dueAt - b.dueAt);
}

// Jobs with a reminder coming up, soonest first.
export function computeUpcoming(projects, entries, now = Date.now()) {
  return projects.map((p) => planFor(p, entries, now)).filter((x) => x && !x.isDue).sort((a, b) => a.dueAt - b.dueAt);
}

export function inDays(dueAt, now = Date.now()) {
  const d = Math.max(1, Math.ceil((dueAt - now) / DAY));
  return d === 1 ? "tomorrow" : `in ${d} days`;
}

const LINES = {
  estimate: [
    "Checking in 2-3 days after an estimate is standard practice. You're not being pushy.",
    "A second check-in about a week to ten days out is normal. Sales research suggests most sales take five or more follow-ups.",
    "A short final check-in near the two-week mark is a courtesy. It tells them whether to keep the estimate open.",
  ],
  "In Progress": ["Regular check-ins keep clients confident. A quick call now will be welcome."],
  "On Hold": ["A friendly check-in on a paused job shows you haven't forgotten about them."],
  Completed: ["Staying in touch with past clients is how referrals and repeat work happen."],
};

export function encouragement(f) {
  const list = f.status === "Planning" ? LINES.estimate : LINES[f.status] || LINES["In Progress"];
  return list[Math.min(f.step, list.length - 1)];
}

export function headline(f) {
  if (f.status === "Planning") {
    return f.hasContact ? `Estimate follow-up. Last contact ${f.daysSince} day${f.daysSince === 1 ? "" : "s"} ago` : "Estimate follow-up. No contact logged yet";
  }
  return f.hasContact ? `${f.daysSince} days since your last contact` : `No contact logged yet (${f.daysSince} days)`;
}

export const snoozeDate = (days = 3) => new Date(Date.now() + days * DAY).toLocaleDateString("en-CA");
