import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Guest access for BuilderTrac share links (no account, no payment).
//
// A guest opens /g/<token>. This function is the ONLY door they have: it looks up
// the ShareLink by its secret token, works out which projects that link covers
// (always limited to the link owner's own projects), and then enforces what the
// link's role is allowed to do.
//
//   customer         -> view their project(s); upload photos and documents. Nothing else.
//   team_member      -> everything a customer can, plus see appointments and messages,
//                       post messages, and change a task's status.
//   project_manager  -> runs ONE portfolio and every project in it (only valid on a
//                       PORTFOLIO link). Everything a team member can, plus: edit the
//                       portfolio's details, add / edit / delete projects (including
//                       budgets), add / edit / delete tasks and subtasks, add / delete
//                       appointments, and delete photos, documents and messages.
//                       Can also invite customers and team members (never other project
//                       managers) to the portfolio or to any single project in it, and
//                       turn those links off.
//                       Can NOT: delete the portfolio itself, create project-manager
//                       links, reach any other portfolio, or touch account settings.

const TASK_STATUSES = ['Not Started', 'In Progress', 'Pending Approval', 'Blocked', 'Done'];
const PROJECT_STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'];
const DOC_CATEGORIES = ['Plans', 'Invoices', 'Change Order', 'Permits', 'Contract'];
const MAX_BASE64 = 14_000_000; // ~10 MB file
const DOC_EXT = /\.(pdf|png|jpe?g|heic|gif|webp|docx?|xlsx?|pptx?|txt|csv|dwg|zip)$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@,;<>"]{1,64}@[^\s@,;<>"]{1,190}\.[a-z]{2,24}$/i;
// A share link is a bearer secret, so it must not double as a free email relay.
// Only invite mail is allowed, to an address not already invited, a few times a day per account.
const MAX_INVITE_EMAILS_PER_DAY = 10;
const PUBLIC_URL = 'https://mybuildertrac.base44.app';
const makeToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1_000_000_000_000) : 0;
};

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
    // Links made by a project manager carry owner_id so they still belong to the owner's account.
    const ownerId = link.owner_id || link.created_by_id;
    if (!ownerId) return json({ error: 'invalid_link' }, 404);

    // A project-manager link only counts as one when it is tied to a portfolio.
    let role = link.role === 'project_manager' ? 'project_manager' : link.role === 'team_member' ? 'team_member' : 'customer';
    if (role === 'project_manager' && (link.scope !== 'portfolio' || !link.portfolio_name)) role = 'team_member';
    const isPM = role === 'project_manager';
    const isTeam = role !== 'customer';
    const guestLabel = clean(link.guest_name || link.guest_email || 'Guest', 80);
    const isOwners = (r: any) => r && (r.created_by_id === ownerId || r.owner_id === ownerId);

    // Which projects does this link cover? Always limited to the owner's own projects.
    let projects: any[] = [];
    if (link.scope === 'portfolio') {
      if (link.portfolio_name) {
        const all = await db.Project.filter({ portfolio: link.portfolio_name });
        projects = all.filter(isOwners);
      }
    } else if (link.project_id) {
      try {
        const p = await db.Project.get(link.project_id);
        if (isOwners(p)) projects = [p];
      } catch (_e) { /* not found */ }
    }
    const projectIds = new Set(projects.map((p: any) => p.id));

    // The portfolio record (only used for project managers, to show/edit its details)
    const getPortfolio = async () => {
      if (!link.portfolio_name) return null;
      const rows = await db.Portfolio.filter({ name: link.portfolio_name });
      return rows.find(isOwners) || null;
    };

    if (action === 'load') {
      const data = await Promise.all(projects.map(async (p: any) => {
        const [tasks, photos, docs, notes, appts] = await Promise.all([
          db.Task.filter({ project_id: p.id }),
          db.SitePhoto.filter({ project_id: p.id }),
          db.Document.filter({ project_id: p.id }),
          isTeam ? db.Note.filter({ project_id: p.id }) : Promise.resolve([]),
          isTeam ? db.Appointment.filter({ project_id: p.id }) : Promise.resolve([]),
        ]);
        return {
          id: p.id,
          name: p.name,
          address: p.address,
          status: p.status,
          portfolio: p.portfolio,
          description: p.description,
          ...(isPM ? { budget_total: p.budget_total || 0, budget_spent: p.budget_spent || 0 } : {}),
          tasks: tasks.map((t: any) => ({
            id: t.id, title: t.title, description: t.description, status: t.status,
            priority: t.priority, due_date: t.due_date, completed: !!t.completed,
            assigned_to: t.assigned_to || '', parent_task_id: t.parent_task_id || null,
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
          appointments: appts.map((a: any) => ({
            id: a.id, title: a.title, date: a.date, start_time: a.start_time, end_time: a.end_time,
            location: a.location, notes: a.notes,
          })),
        };
      }));

      let portfolio = null;
      let portfolio_style = null;
      {
        const pf = await getPortfolio();
        if (pf) {
          portfolio_style = { icon: pf.icon || null, color: pf.color || null, logo_url: pf.logo_url || null };
        }
        if (isPM && pf) {
          portfolio = {
            name: pf.name, description: pf.description || '', contact_name: pf.contact_name || '',
            contact_email: pf.contact_email || '', contact_phone: pf.contact_phone || '',
            business_address: pf.business_address || '',
          };
        }
      }

      // Project managers see the customer / team-member links for their portfolio (never other PM links).
      let links: any[] = [];
      if (isPM) {
        const all = await db.ShareLink.list();
        links = all
          .filter((l: any) => isOwners(l) && l.role !== 'project_manager' &&
            ((l.scope === 'portfolio' && l.portfolio_name === link.portfolio_name) ||
             (l.scope === 'project' && projectIds.has(l.project_id))))
          .map((l: any) => ({
            id: l.id, token: l.token, role: l.role, scope: l.scope, project_id: l.project_id || null,
            guest_name: l.guest_name || '', guest_email: l.guest_email || '', active: l.active !== false,
            last_opened: l.last_opened || null,
          }));
      }

      // Remember when the link was last used (best effort).
      try { await db.ShareLink.update(link.id, { last_opened: new Date().toISOString() }); } catch (_e) { /* ignore */ }

      return json({
        role,
        guest_name: link.guest_name || '',
        owner_name: link.owner_name || '',
        portfolio_name: link.portfolio_name || '',
        portfolio,
        portfolio_style,
        links,
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

    // Project-manager-only actions (never reach outside the portfolio on the link)
    if (isPM) {
      const portfolioName = link.portfolio_name;

      if (action === 'updatePortfolio') {
        const pf = await getPortfolio();
        if (!pf) return json({ error: 'not_allowed' }, 403);
        const patch: Record<string, unknown> = {};
        if (body.description !== undefined) patch.description = clean(body.description, 1000);
        if (body.contact_name !== undefined) patch.contact_name = clean(body.contact_name, 120);
        if (body.contact_email !== undefined) patch.contact_email = clean(body.contact_email, 200);
        if (body.contact_phone !== undefined) patch.contact_phone = clean(body.contact_phone, 60);
        if (body.business_address !== undefined) patch.business_address = clean(body.business_address, 300);
        await db.Portfolio.update(pf.id, patch);
        return json({ ok: true });
      }

      // ----- Invite / manage customers and team members -----
      if (action === 'createLink') {
        const inviteRole = body.role === 'team_member' ? 'team_member' : 'customer';
        const name = clean(body.guest_name, 80);
        const email = clean(body.guest_email, 200).toLowerCase();
        if (!name && !email) return json({ error: 'empty' }, 400);
        if (email && !EMAIL_RE.test(email)) return json({ error: 'bad_email' }, 400);
        let scope = 'portfolio';
        let pid: string | undefined;
        let label = link.portfolio_name;
        if (body.project_id) {
          const proj = projects.find((p: any) => p.id === clean(body.project_id, 64));
          if (!proj) return json({ error: 'not_allowed' }, 403);
          scope = 'project';
          pid = proj.id;
          label = proj.name;
        }
        const newToken = makeToken();
        const rec = await db.ShareLink.create({
          token: newToken,
          role: inviteRole,
          scope,
          project_id: pid,
          portfolio_name: scope === 'portfolio' ? link.portfolio_name : undefined,
          guest_name: name,
          guest_email: email,
          active: true,
          owner_name: link.owner_name || '',
          owner_id: ownerId,
          invited_by: guestLabel,
        });
        const url = `${PUBLIC_URL}/g/${newToken}`;
        let emailed = false;

        // Only mail a genuinely new invite, and never more than a handful a day for the account,
        // so a leaked project-manager link cannot be used to send mail to arbitrary addresses.
        let mayEmail = false;
        if (email) {
          const owned = await db.ShareLink.filter({ owner_id: ownerId });
          const alreadyInvited = owned.some((l: any) => l.active !== false &&
            String(l.guest_email || '').toLowerCase() === email &&
            ((l.scope === 'portfolio' && l.portfolio_name === link.portfolio_name) ||
             (l.scope === 'project' && l.project_id === pid)));
          if (!alreadyInvited) {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const sentLastDay = owned.filter((l: any) =>
              l.guest_email && String(l.created_date || '') >= since).length;
            mayEmail = sentLastDay < MAX_INVITE_EMAILS_PER_DAY;
          }
        }

        if (mayEmail) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: email,
              subject: `${guestLabel} shared ${label} with you on BuilderTrac`,
              body: `Hi${name ? ' ' + name : ''},\n\n${guestLabel}${link.owner_name ? ' (' + link.owner_name + ')' : ''} has shared ${label} with you on BuilderTrac.\n\nOpen it here — no account or sign-up needed:\n${url}\n\nIf it opens the BuilderTrac app instead, press and hold the link and choose Open in Safari.\n\nKeep this link private. Anyone who has it can open the project.\n\n— BuilderTrac`,
            });
            emailed = true;
          } catch (_e) { /* fall back to copying the link */ }
        }
        return json({ ok: true, id: rec.id, url, emailed });
      }

      if (action === 'setLinkActive' || action === 'deleteLink') {
        const target = await db.ShareLink.get(clean(body.link_id, 64)).catch(() => null);
        const inScope = target && isOwners(target) && target.role !== 'project_manager' &&
          ((target.scope === 'portfolio' && target.portfolio_name === link.portfolio_name) ||
           (target.scope === 'project' && projectIds.has(target.project_id)));
        if (!inScope) return json({ error: 'not_allowed' }, 403);
        if (action === 'deleteLink') { await db.ShareLink.delete(target.id); return json({ ok: true }); }
        await db.ShareLink.update(target.id, { active: !!body.active });
        return json({ ok: true });
      }

      if (action === 'addProject') {
        const name = clean(body.name, 120);
        if (!name || !portfolioName) return json({ error: 'empty' }, 400);
        const rec = await db.Project.create({
          name,
          address: clean(body.address, 200),
          portfolio: portfolioName,
          status: PROJECT_STATUSES.includes(body.status) ? body.status : 'Planning',
          budget_total: money(body.budget_total),
          budget_spent: money(body.budget_spent),
          description: clean(body.description, 1000),
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
        if (body.budget_total !== undefined) patch.budget_total = money(body.budget_total);
        if (body.budget_spent !== undefined) patch.budget_spent = money(body.budget_spent);
        if (body.status !== undefined) {
          if (!PROJECT_STATUSES.includes(body.status)) return json({ error: 'bad_status' }, 400);
          patch.status = body.status;
        }
        await db.Project.update(projectId, patch);
        return json({ ok: true });
      }

      if (action === 'deleteProject') {
        if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
        await db.Project.delete(projectId);
        return json({ ok: true });
      }

      if (action === 'addTask') {
        if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
        const title = clean(body.title, 200);
        if (!title) return json({ error: 'empty' }, 400);
        let parentId: string | undefined;
        if (body.parent_task_id) {
          const parent = await db.Task.get(clean(body.parent_task_id, 64)).catch(() => null);
          if (!parent || parent.project_id !== projectId) return json({ error: 'not_allowed' }, 403);
          parentId = parent.id;
        }
        const rec = await db.Task.create({
          title,
          description: clean(body.description, 1000),
          project_id: projectId,
          parent_task_id: parentId,
          assigned_to: clean(body.assigned_to, 200),
          status: 'Not Started',
          priority: ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium',
          due_date: DATE_RE.test(String(body.due_date || '')) ? body.due_date : undefined,
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
        if (body.description !== undefined) patch.description = clean(body.description, 1000);
        if (body.assigned_to !== undefined) patch.assigned_to = clean(body.assigned_to, 200);
        if (body.due_date !== undefined) patch.due_date = DATE_RE.test(String(body.due_date)) ? body.due_date : null;
        if (body.priority !== undefined && ['high', 'medium', 'low'].includes(body.priority)) patch.priority = body.priority;
        await db.Task.update(task.id, patch);
        return json({ ok: true });
      }

      if (action === 'addAppointment') {
        if (!projectIds.has(projectId)) return json({ error: 'not_allowed' }, 403);
        const title = clean(body.title, 160);
        if (!title || !DATE_RE.test(String(body.date || ''))) return json({ error: 'empty' }, 400);
        const rec = await db.Appointment.create({
          title,
          date: body.date,
          start_time: clean(body.start_time, 20),
          end_time: clean(body.end_time, 20),
          location: clean(body.location, 200),
          notes: clean(body.notes, 1000),
          project_id: projectId,
          owner_id: ownerId,
        });
        return json({ ok: true, id: rec.id });
      }

      if (['deletePhoto', 'deleteDoc', 'deleteNote', 'deleteAppointment'].includes(action)) {
        const entity = action === 'deletePhoto' ? db.SitePhoto
          : action === 'deleteDoc' ? db.Document
          : action === 'deleteNote' ? db.Note
          : db.Appointment;
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