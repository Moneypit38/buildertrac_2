import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Guest access for BuilderTrac share links (no account, no payment).
//
// A guest opens /g/<token>. This function is the ONLY door they have: it looks up
// the ShareLink by its secret token, works out which projects that link covers
// (always limited to the link owner's own projects), and then enforces what the
// link's role is allowed to do.
//
//   customer     -> view their project(s); upload photos and documents. Nothing else.
//   team_member  -> everything a customer can, plus see messages, post messages,
//                   and change a task's status. Can't edit the project, budget,
//                   members, or delete anything.
//   admin        -> portfolio manager. Only valid on a PORTFOLIO link, and only ever
//                   touches that one portfolio. Everything a team member can, plus
//                   add/edit/delete tasks, edit project details and status, add new
//                   projects to the portfolio, and remove photos, documents and messages.
//                   Can NOT touch budgets, delete projects or the portfolio, share
//                   links, or reach any other portfolio.

const TASK_STATUSES = ['Not Started', 'In Progress', 'Pending Approval', 'Blocked', 'Done'];
const DOC_CATEGORIES = ['Plans', 'RFI', 'Change Order', 'Report', 'Contract'];
const MAX_BASE64 = 14_000_000; // ~10 MB file
const DOC_EXT = /\.(pdf|png|jpe?g|heic|gif|webp|docx?|xlsx?|pptx?|txt|csv|dwg|zip)$/i;

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

function toFile(b64: string, name: string, type: string): File {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;

    const body = await req.json().catch(() => ({}));
    const token = clean(body.token, 200);
    const action = clean(body.action, 40) || 'load';

    // Tokens are long random hex strings; reject anything else before touching the database.
    if (!/^[a-f0-9]{40,128}$/.test(token)) return json({ error: 'invalid_link' }, 404);

    const found = await db.ShareLink.filter({ token });
    const link = found?.[0];
    const today = new Date().toISOString().slice(0, 10);
    if (!link || link.active === false || (link.expires_at && link.expires_at < today)) {
      return json({ error: 'invalid_link' }, 404);
    }
    const ownerId = link.created_by_id;
    if (!ownerId) return json({ error: 'invalid_link' }, 404);

    // An admin link only counts as admin when it is tied to a portfolio; otherwise treat it as team member.
    let role = link.role === 'admin' ? 'admin' : link.role === 'team_member' ? 'team_member' : 'customer';
    if (role === 'admin' && link.scope !== 'portfolio') role = 'team_member';
    const isAdmin = role === 'admin';
    const isTeam = role !== 'customer';
    const guestLabel = clean(link.guest_name || link.guest_email || 'Guest', 80);

    // Which projects does this link cover? Always limited to the owner's own projects.
    let projects: any[] = [];
    if (link.scope === 'portfolio') {
      if (link.portfolio_name) {
        const all = await db.Project.filter({ portfolio: link.portfolio_name });
        projects = all.filter((p: any) => p.created_by_id === ownerId || p.owner_id === ownerId);
      }
    } else if (link.project_id) {
      try {
        const p = await db.Project.get(link.project_id);
        if (p && (p.created_by_id === ownerId || p.owner_id === ownerId)) projects = [p];
      } catch (_e) { /* not found */ }
    }
    const projectIds = new Set(projects.map((p: any) => p.id));

    if (action === 'load') {
      const data = await Promise.all(projects.map(async (p: any) => {
        const [tasks, photos, docs, notes] = await Promise.all([
          db.Task.filter({ project_id: p.id }),
          db.SitePhoto.filter({ project_id: p.id }),
          db.Document.filter({ project_id: p.id }),
          isTeam ? db.Note.filter({ project_id: p.id }) : Promise.resolve([]),
        ]);
        return {
          id: p.id,
          name: p.name,
          address: p.address,
          status: p.status,
          portfolio: p.portfolio,
          description: p.description,
          tasks: tasks.map((t: any) => ({
            id: t.id, title: t.title, description: t.description, status: t.status,
            priority: t.priority, due_date: t.due_date, completed: !!t.completed,
            parent_task_id: t.parent_task_id || null,
          })),
          photos: photos.map((x: any) => ({
            id: x.id, title: x.title, description: x.description, photo_url: x.photo_url,
            created_date: x.created_date, uploaded_by_guest: x.uploaded_by_guest || null,
          })),
          docs: docs.map((x: any) => ({
            id: x.id, name: x.name, category: x.category, version: x.version, file_url: x.file_url,
            description: x.description, size: x.size, created_date: x.created_date,
            uploaded_by_guest: x.uploaded_by_guest || null,
          })),
          notes: notes.map((n: any) => ({
            id: n.id, content: n.content, author_name: n.author_name,
            author_email: n.author_email, created_date: n.created_date,
          })),
        };
      }));

      // Remember when the link was last used (best effort).
      try { await db.ShareLink.update(link.id, { last_opened: new Date().toISOString() }); } catch (_e) { /* ignore */ }

      return json({
        role,
        guest_name: link.guest_name || '',
        owner_name: link.owner_name || '',
        portfolio_name: link.portfolio_name || '',
        projects: data,
      });
    }

    // ----- Everything below changes data and must target a project this link covers -----
    const projectId = clean(body.project_id, 64);

    if (action === 'addPhoto' || action === 'addDoc') {
      if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
      const b64 = String(body.data_base64 || '');
      if (!b64 || b64.length > MAX_BASE64) return json({ error: 'file_too_large' }, 413);
      const fileName = clean(body.file_name, 120) || 'upload';
      const mime = clean(body.file_type, 100) || 'application/octet-stream';

      if (action === 'addPhoto') {
        if (!mime.startsWith('image/')) return json({ error: 'images_only' }, 400);
        const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: toFile(b64, fileName, mime) });
        const rec = await db.SitePhoto.create({
          title: clean(body.title, 120) || 'Photo from ' + guestLabel,
          description: clean(body.description, 500),
          photo_url: up.file_url,
          project_id: projectId,
          owner_id: ownerId,
          uploaded_by_guest: guestLabel,
        });
        return json({ ok: true, id: rec.id, photo_url: up.file_url });
      }

      if (!DOC_EXT.test(fileName) && !mime.startsWith('image/')) return json({ error: 'file_type_not_allowed' }, 400);
      const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: toFile(b64, fileName, mime) });
      const category = DOC_CATEGORIES.includes(body.category) ? body.category : 'Plans';
      const rec = await db.Document.create({
        name: clean(body.name, 120) || fileName,
        category,
        version: 1,
        file_url: up.file_url,
        description: clean(body.description, 500),
        size: `${Math.max(1, Math.round((b64.length * 0.75) / 1024))} KB`,
        project_id: projectId,
        owner_id: ownerId,
        uploaded_by_guest: guestLabel,
      });
      return json({ ok: true, id: rec.id, file_url: up.file_url });
    }

    // Portfolio-admin-only actions (never reach outside the portfolio on the link)
    if (isAdmin) {
      const portfolioName = link.portfolio_name;

      if (action === 'addProject') {
        const name = clean(body.name, 120);
        if (!name || !portfolioName) return json({ error: 'empty' }, 400);
        const status = ['Planning', 'In Progress', 'On Hold', 'Completed'].includes(body.status) ? body.status : 'Planning';
        const rec = await db.Project.create({
          name,
          address: clean(body.address, 200),
          portfolio: portfolioName,
          status,
          owner_id: ownerId,
        });
        return json({ ok: true, id: rec.id });
      }

      if (action === 'updateProject') {
        if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
        const patch: Record<string, unknown> = {};
        if (body.name !== undefined) { const n = clean(body.name, 120); if (!n) return json({ error: 'empty' }, 400); patch.name = n; }
        if (body.address !== undefined) patch.address = clean(body.address, 200);
        if (body.description !== undefined) patch.description = clean(body.description, 1000);
        if (body.status !== undefined) {
          if (!['Planning', 'In Progress', 'On Hold', 'Completed'].includes(body.status)) return json({ error: 'bad_status' }, 400);
          patch.status = body.status;
        }
        await db.Project.update(projectId, patch);
        return json({ ok: true });
      }

      if (action === 'addTask') {
        if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
        const title = clean(body.title, 200);
        if (!title) return json({ error: 'empty' }, 400);
        const due = /^\d{4}-\d{2}-\d{2}$/.test(String(body.due_date || '')) ? body.due_date : undefined;
        const rec = await db.Task.create({
          title,
          project_id: projectId,
          status: 'Not Started',
          priority: ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium',
          due_date: due,
          completed: false,
          owner_id: ownerId,
        });
        return json({ ok: true, id: rec.id });
      }

      if (action === 'editTask' || action === 'deleteTask') {
        const task = await db.Task.get(clean(body.task_id, 64)).catch(() => null);
        if (!task || !projectIds.has(task.project_id)) return json({ error: 'not_allowed' }, 403);
        if (action === 'deleteTask') { await db.Task.delete(task.id); return json({ ok: true }); }
        const patch: Record<string, unknown> = {};
        if (body.title !== undefined) { const t = clean(body.title, 200); if (!t) return json({ error: 'empty' }, 400); patch.title = t; }
        if (body.due_date !== undefined) patch.due_date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.due_date)) ? body.due_date : null;
        if (body.priority !== undefined && ['high', 'medium', 'low'].includes(body.priority)) patch.priority = body.priority;
        await db.Task.update(task.id, patch);
        return json({ ok: true });
      }

      if (action === 'deletePhoto' || action === 'deleteDoc' || action === 'deleteNote') {
        const entity = action === 'deletePhoto' ? db.SitePhoto : action === 'deleteDoc' ? db.Document : db.Note;
        const rec = await entity.get(clean(body.record_id, 64)).catch(() => null);
        if (!rec || !projectIds.has(rec.project_id)) return json({ error: 'not_allowed' }, 403);
        await entity.delete(rec.id);
        return json({ ok: true });
      }
    }

    // Team-member-and-up actions
    if (action === 'addNote') {
      if (!isTeam) return json({ error: 'not_allowed' }, 403);
      if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
      const content = clean(body.content, 2000);
      if (!content) return json({ error: 'empty' }, 400);
      const rec = await db.Note.create({
        project_id: projectId,
        content,
        author_name: guestLabel,
        author_email: link.guest_email || '',
        owner_id: ownerId,
      });
      return json({ ok: true, id: rec.id });
    }

    if (action === 'updateTask') {
      if (!isTeam) return json({ error: 'not_allowed' }, 403);
      const task = await db.Task.get(clean(body.task_id, 64)).catch(() => null);
      if (!task || !projectIds.has(task.project_id)) return json({ error: 'not_allowed' }, 403);
      const status = clean(body.status, 40);
      if (!TASK_STATUSES.includes(status)) return json({ error: 'bad_status' }, 400);
      await db.Task.update(task.id, { status, completed: status === 'Done' });
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (error) {
    console.error('guestAccess error:', error);
    return json({ error: 'server_error' }, 500);
  }
});
