// Works out whose account a guest link belongs to. Shared by every function that opens a link.
//
// ShareLink.owner_id is an ordinary field that any signed-in user can write when they create a
// link, so it is never trusted on its own. It only counts when the link also names the
// project-manager link it was made from (parent_token, set server-side when a project manager
// invites someone) and that parent link is a real, active project-manager link for the same
// portfolio. Anything else belongs to whoever created the link, which the server sets.

const TOKEN_RE = /^[a-f0-9]{40,128}$/;

export async function resolveShareLinkOwner(db: any, link: any, today: string): Promise<string | null> {
  const parentToken = typeof link?.parent_token === 'string' ? link.parent_token : '';

  if (!TOKEN_RE.test(parentToken)) return link?.created_by_id || null;

  const parent = (await db.ShareLink.filter({ token: parentToken }))?.[0];
  const usable = !!parent &&
    parent.id !== link.id &&
    parent.active !== false &&
    !(parent.expires_at && parent.expires_at < today) &&
    parent.role === 'project_manager' &&
    parent.scope === 'portfolio' &&
    !!parent.portfolio_name &&
    !parent.parent_token &&
    (link.scope !== 'portfolio' || link.portfolio_name === parent.portfolio_name);

  return usable ? (parent.created_by_id || null) : null;
}