import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// The app's two outbound mails, sent server-side only. Neither takes a recipient from the
// request: the share invite mails the address stored on a link the caller owns, and the
// deletion request always goes to the app's own support address.
//
//   share_invite      -> { token }  (signed-in owner of that link)
//   account_deletion  -> { email }  (public page, recipient is fixed)

const SUPPORT_EMAIL = 'support@buildertrac.app';
const PUBLIC_URL = 'https://mybuildertrac.base44.app';
const EMAIL_RE = /^[^\s@,;<>"]{1,64}@[^\s@,;<>"]{1,190}\.[a-z]{2,24}$/i;
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = clean(body.action, 40);

    if (action === 'account_deletion') {
      const email = clean(body.email, 200).toLowerCase();
      if (!EMAIL_RE.test(email)) return Response.json({ error: 'bad_email' }, { status: 400 });
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: SUPPORT_EMAIL,
        subject: 'Account Deletion Request',
        body: `A user has requested account deletion.\n\nEmail: ${email}\nDate: ${new Date().toISOString()}\n\nPlease delete this user's account and all associated data within 30 days.`,
      });
      return Response.json({ ok: true });
    }

    if (action === 'share_invite') {
      const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
      if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

      const token = clean(body.token, 200);
      if (!/^[a-f0-9]{40,128}$/.test(token)) return Response.json({ error: 'invalid_link' }, { status: 400 });

      const db = base44.asServiceRole.entities;
      const found = await db.ShareLink.filter({ token });
      const link = found?.[0];
      if (!link || link.active === false) return Response.json({ error: 'invalid_link' }, { status: 404 });
      if (link.created_by_id !== user.id && link.owner_id !== user.id) {
        return Response.json({ error: 'not_allowed' }, { status: 403 });
      }

      const to = clean(link.guest_email, 200).toLowerCase();
      if (!EMAIL_RE.test(to)) return Response.json({ error: 'bad_email' }, { status: 400 });

      let label = clean(link.portfolio_name, 200);
      if (link.scope === 'project' && link.project_id) {
        const proj = await db.Project.get(link.project_id).catch(() => null);
        if (proj?.name) label = clean(proj.name, 200);
      }
      label = label || 'a project';

      const guestName = clean(link.guest_name, 80);
      const ownerName = clean(link.owner_name || user.full_name || user.email, 120) || 'Your contractor';

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          subject: `${ownerName} shared ${label} with you on BuilderTrac`,
          body: `Hi${guestName ? ' ' + guestName : ''},\n\n${ownerName} has shared ${label} with you on BuilderTrac.\n\nOpen it here — no account or sign-up needed:\n${PUBLIC_URL}/g/${token}\n\nIf it opens the BuilderTrac app instead, press and hold the link and choose Open in Safari.\n\nKeep this link private. Anyone who has it can open the project.\n\n— BuilderTrac`,
        });
      } catch (mailError: any) {
        // The link is already created; the caller falls back to copying or texting it.
        console.error('share invite email failed:', mailError?.message || mailError);
        return Response.json({ ok: true, emailed: false });
      }

      return Response.json({ ok: true, emailed: true });
    }

    return Response.json({ error: 'unknown_action' }, { status: 400 });
  } catch (error: any) {
    console.error('sendAppEmail error:', error);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
}