import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { resolveShareLinkOwner } from '../../shared/shareLinkOwner.ts';

// Team chat + private direct messages for BuilderTrac.
//
// Who can chat: the account owner, team members and project managers.
// Customers never send or receive chat messages.
//
// Privacy:
//   * Chat messages can only be read through this function (the entity itself is locked).
//   * A direct message can be read only by the two people in it. Not even the owner can read
//     other people's direct messages.
//   * Messages are checked automatically for threats, sexual content and harassment. A hit
//     creates an alert for the owner that says who, where and what kind, but never the text.
//   * Anyone who receives a message can report it. Only then is that one message shown to the owner.

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

// A starting set of rules. Easy to extend later.
const RULES: Array<[string, RegExp]> = [
  ['threat', /\b(i('| a)?ll|i will|gonna|going to)\s+(kill|hurt|shoot|stab|beat up|come after)\b|\bkill (you|yourself)\b|\bi know where you live\b/i],
  ['sexual content', /\b(nudes?|dick ?pics?|sext(ing)?|send (me )?(a )?(pics?|photos?) of you|blow ?job|porn)\b/i],
  ['harassment', /\b(fuck you|fuck off|piece of shit|you(('| a)re| are) (a |an )?(stupid |dumb )?(bitch|cunt|whore|slut|retard))\b/i],
];
const screen = (text: string): string | null => {
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return null;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const action = clean(body.action, 30) || 'who';
    const token = clean(body.token, 200);
    const today = new Date().toISOString().slice(0, 10);

    // ----- Who is asking? -----
    let me: any = null;
    if (token) {
      if (!/^[a-f0-9]{40,128}$/.test(token)) return json({ error: 'invalid_link' }, 404);
      const link = (await db.ShareLink.filter({ token }))?.[0];
      if (!link || link.active === false || (link.expires_at && link.expires_at < today)) return json({ error: 'invalid_link' }, 404);
      // owner_id on a link is client-writable, so the anchor comes from the shared check.
      const ownerId = await resolveShareLinkOwner(db, link, today);
      if (!ownerId) return json({ error: 'invalid_link' }, 404);
      const role = link.role === 'project_manager' ? 'project_manager' : link.role === 'team_member' ? 'team_member' : 'customer';
      me = {
        id: `link:${link.id}`, name: clean(link.guest_name || link.guest_email || 'Team member', 80),
        role, ownerId, ownerName: clean(link.owner_name || 'Owner', 80), link,
      };
    } else {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return json({ error: 'not_signed_in' }, 401);
      me = { id: `user:${user.id}`, name: clean(user.full_name || user.email || 'Owner', 80), role: 'owner', ownerId: user.id, ownerName: clean(user.full_name || 'Owner', 80), link: null };
    }

    // Customers don't get chat at all.
    if (me.role === 'customer') return json({ allowed: false });

    const ownerId = me.ownerId;
    const isOwners = (r: any) => r && (r.created_by_id === ownerId || r.owner_id === ownerId);

    // ----- Rooms and people this person can reach -----
    const [allLinks, allProjects, allPortfolios] = await Promise.all([
      db.ShareLink.list('-created_date', 1000),
      db.Project.list('-created_date', 1000),
      db.Portfolio.list('-created_date', 1000),
    ]);
    const links = allLinks.filter((l: any) => isOwners(l) && l.active !== false && l.role !== 'customer' && !(l.expires_at && l.expires_at < today));
    const projects = allProjects.filter(isOwners);
    const roomOf = (l: any): string => {
      if (l.scope === 'portfolio') return l.portfolio_name || 'General';
      return projects.find((p: any) => p.id === l.project_id)?.portfolio || 'General';
    };
    const personOf = (l: any) => ({ id: `link:${l.id}`, name: clean(l.guest_name || l.guest_email || 'Team member', 80), role: l.role });
    const ownerPerson = { id: `user:${ownerId}`, name: me.ownerName, role: 'owner' };

    let rooms: string[] = [];
    let people: any[] = [];
    if (me.role === 'owner') {
      rooms = Array.from(new Set([...allPortfolios.filter(isOwners).map((p: any) => p.name), ...links.map(roomOf)].filter(Boolean)));
      people = links.map(personOf);
    } else {
      const myRoom = roomOf(me.link);
      rooms = [myRoom];
      people = [ownerPerson, ...links.filter((l: any) => l.id !== me.link.id && roomOf(l) === myRoom).map(personOf)];
    }
    rooms.sort();

    const teamThread = (room: string) => `team:${ownerId}:${room}`;
    const dmThread = (a: string, b: string) => `dm:${ownerId}:${[a, b].sort().join('|')}`;
    const myIdentity = { id: me.id, name: me.name, role: me.role };

    if (action === 'who') {
      return json({ allowed: true, me: myIdentity, rooms, people });
    }

    // Resolve which thread the caller is talking about, and check they're allowed in it.
    const resolveThread = () => {
      if (body.kind === 'team') {
        const room = clean(body.room, 120);
        if (!rooms.includes(room)) return null;
        return { kind: 'team', room, thread: teamThread(room), other: null as any };
      }
      if (body.kind === 'dm') {
        const withId = clean(body.with, 80);
        const other = people.find((p: any) => p.id === withId);
        if (!other || withId === me.id) return null;
        return { kind: 'dm', room: '', thread: dmThread(me.id, withId), other };
      }
      return null;
    };

    if (action === 'messages') {
      const t = resolveThread();
      if (!t) return json({ error: 'not_allowed' }, 403);
      const rows = await db.ChatMessage.filter({ thread: t.thread }, '-created_date', 100);
      const out = rows.reverse().map((m: any) => ({
        id: m.id, sender_id: m.sender_id, sender_name: m.sender_name, content: m.content,
        created_date: m.created_date, mine: m.sender_id === me.id,
      }));
      return json({ messages: out });
    }

    // One message to several people: each person gets it as their own private direct message.
    if (action === 'send' && body.kind === 'dm_many') {
      const ids = Array.from(new Set((Array.isArray(body.with_many) ? body.with_many : []).map((x: any) => clean(x, 80)))).slice(0, 50);
      const targets = ids.map((id) => people.find((p: any) => p.id === id)).filter((p: any) => p && p.id !== me.id);
      const content = clean(body.content, 2000);
      if (!targets.length || !content) return json({ error: 'empty' }, 400);
      const category = screen(content);
      for (const t of targets as any[]) {
        await db.ChatMessage.create({
          owner_id: ownerId, kind: 'dm', room: '', thread: dmThread(me.id, t.id),
          sender_id: me.id, sender_name: me.name, sender_role: me.role,
          recipient_id: t.id, content, flagged: !!category,
        });
      }
      if (category) {
        await db.ChatFlag.create({
          owner_id: ownerId, source: 'auto', category, thread_kind: 'dm', room: '',
          sender_id: me.id, sender_name: me.name, recipient_name: (targets as any[]).map((t) => t.name).join(', ').slice(0, 200), resolved: false,
        });
      }
      return json({ ok: true, sent: targets.length });
    }

    if (action === 'send') {
      const t = resolveThread();
      if (!t) return json({ error: 'not_allowed' }, 403);
      const content = clean(body.content, 2000);
      if (!content) return json({ error: 'empty' }, 400);
      const category = screen(content);
      const rec = await db.ChatMessage.create({
        owner_id: ownerId, kind: t.kind, room: t.room, thread: t.thread,
        sender_id: me.id, sender_name: me.name, sender_role: me.role,
        recipient_id: t.other ? t.other.id : '', content, flagged: !!category,
      });
      if (category) {
        // The alert never contains the message text.
        await db.ChatFlag.create({
          owner_id: ownerId, source: 'auto', category, thread_kind: t.kind, room: t.room,
          sender_id: me.id, sender_name: me.name, recipient_name: t.other ? t.other.name : '', resolved: false,
        });
      }
      return json({ ok: true, id: rec.id });
    }

    if (action === 'report') {
      const msg = await db.ChatMessage.get(clean(body.message_id, 64)).catch(() => null);
      if (!msg || msg.owner_id !== ownerId || msg.sender_id === me.id) return json({ error: 'not_allowed' }, 403);
      // The reporter must be part of the conversation.
      let inThread = false;
      let recipientName = '';
      if (msg.kind === 'team') inThread = rooms.includes(msg.room);
      else if (msg.kind === 'dm') { inThread = msg.recipient_id === me.id; recipientName = me.name; }
      if (!inThread) return json({ error: 'not_allowed' }, 403);
      await db.ChatFlag.create({
        owner_id: ownerId, source: 'report', category: 'reported by a recipient', thread_kind: msg.kind, room: msg.room || '',
        sender_id: msg.sender_id, sender_name: msg.sender_name, recipient_name: recipientName, reporter_name: me.name,
        reported_text: clean(msg.content, 2000), resolved: false,
      });
      return json({ ok: true });
    }

    if (action === 'inbox') {
      const recent = await db.ChatMessage.filter({ owner_id: ownerId }, '-created_date', 500);
      const latest: Record<string, any> = {};
      for (const m of recent) {
        let key: string | null = null;
        if (m.kind === 'team' && rooms.includes(m.room)) key = `team|${m.room}`;
        else if (m.kind === 'dm' && (m.sender_id === me.id || m.recipient_id === me.id)) key = `dm|${m.sender_id === me.id ? m.recipient_id : m.sender_id}`;
        if (key && !latest[key]) latest[key] = { key, last_at: m.created_date, last_sender_id: m.sender_id };
      }
      let openFlags = 0;
      if (me.role === 'owner') {
        const flags = await db.ChatFlag.filter({ owner_id: ownerId, resolved: false }, '-created_date', 200);
        openFlags = flags.length;
      }
      return json({ threads: Object.values(latest), openFlags });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    // Log the real reason server-side; callers (including guests) only ever get a fixed code.
    console.error('chat error:', e);
    return json({ error: 'server_error' }, 500);
  }
});