// Recipients and wording for the app's two task notification mails.
//
// Both functions are started by the automation system, not by a signed-in caller, so they
// cannot check who asked. Instead every membership row is checked against the project: a
// member only counts when the project's own account added the row AND the address belongs
// to a registered app user. That keeps the app's mail channel from being used to reach
// addresses someone else chose, and keeps one task change from fanning out without limit.

const EMAIL_RE = /^[^\s@,;<>"]{1,64}@[^\s@,;<>"]{1,190}\.[a-z]{2,24}$/i;

export const MAX_NOTIFY_PER_PROJECT = 25;

// Text that goes inside a mail body: one plain line, no markup and no line breaks.
export const plain = (v: unknown, max: number) =>
  String(v ?? '').replace(/[<>\r\n\t\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export async function notificationRecipients(
  db: any,
  project: any,
): Promise<{ email: string; name: string }[]> {
  if (!project?.id) return [];

  const rows = await db.ProjectMember.filter({ project_id: project.id });
  if (!rows?.length) return [];

  // Only the account that owns the project may add people to it.
  const trusted = new Set([project.created_by_id, project.owner_id].filter(Boolean));
  const users = await db.User.list();
  const registered = new Set(users.map((u: any) => String(u.email || '').trim().toLowerCase()));

  const seen = new Set<string>();
  const recipients: { email: string; name: string }[] = [];

  for (const row of rows) {
    if (!trusted.has(row.created_by_id)) continue;
    const email = String(row.user_email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || !registered.has(email) || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ email, name: plain(row.user_name, 80) || email });
    if (recipients.length >= MAX_NOTIFY_PER_PROJECT) break;
  }

  return recipients;
}