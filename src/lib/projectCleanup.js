import { base44 } from "@/api/base44Client";

// Everything that hangs off a project. Deleting a project deletes all of this too.
const CHILDREN = ["Task", "Appointment", "Note", "Document", "SitePhoto", "ProjectMember"];

export async function deleteProjectCascade(projectId) {
  const e = base44.entities;
  for (const name of CHILDREN) {
    const rows = await e[name].filter({ project_id: projectId });
    for (const r of rows) await e[name].delete(r.id);
  }
  // Invite links for just this job (portfolio-wide links are left alone).
  const links = await e.ShareLink.filter({ project_id: projectId });
  for (const l of links) if (l.scope !== "portfolio") await e.ShareLink.delete(l.id);
  await e.Project.delete(projectId);
}

export function deleteWarning(name, counts = {}) {
  const bits = [
    counts.tasks && `${counts.tasks} task${counts.tasks === 1 ? "" : "s"}`,
    counts.notes && `${counts.notes} message${counts.notes === 1 ? "" : "s"}`,
    counts.photos && `${counts.photos} photo${counts.photos === 1 ? "" : "s"}`,
    counts.docs && `${counts.docs} document${counts.docs === 1 ? "" : "s"}`,
  ].filter(Boolean);
  const list = bits.length ? `${bits.join(", ")}, plus ` : "";
  return `This permanently deletes "${name}" along with ${list}its appointments, team members and invite links. This cannot be undone.`;
}

// Finds records whose project no longer exists (left behind by earlier deletions).
export async function findOrphans() {
  const e = base44.entities;
  const projects = await e.Project.list("-created_date", 5000);
  const ids = new Set(projects.map((p) => p.id));
  const found = {};
  for (const name of CHILDREN) {
    const rows = await e[name].list("-created_date", 5000);
    found[name] = rows.filter((r) => r.project_id && !ids.has(r.project_id));
  }
  return found;
}

export async function deleteOrphans(found) {
  const e = base44.entities;
  for (const name of Object.keys(found)) {
    for (const r of found[name]) await e[name].delete(r.id);
  }
}

export const orphanLabel = (name, r) =>
  name === "Task" ? `Task: ${r.title}` :
  name === "Appointment" ? `Appointment: ${r.title}` :
  name === "Note" ? `Message: ${String(r.content || "").slice(0, 40)}` :
  name === "Document" ? `Document: ${r.name}` :
  name === "SitePhoto" ? `Photo: ${r.title}` :
  `Team member: ${r.user_name || r.user_email}`;
