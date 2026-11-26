import { base44 } from "@/api/base44Client";

// token = null for a signed-in user's own account; a guest-link token for a shared job.
export async function callChat(token, action, extra = {}) {
  const res = await base44.functions.invoke("chat", { ...(token ? { token } : {}), action, ...extra });
  return res.data;
}

const seenKey = (meId, key) => `chatSeen:${meId}:${key}`;

export function markSeen(meId, key, ts) {
  try { localStorage.setItem(seenKey(meId, key), ts || new Date().toISOString()); } catch { /* ignore */ }
}

// A conversation is unread when its newest message is from someone else and newer than the last time we opened it.
export function isUnread(meId, t) {
  if (!t || t.last_sender_id === meId) return false;
  try {
    const seen = localStorage.getItem(seenKey(meId, t.key));
    return !seen || String(t.last_at) > seen;
  } catch { return false; }
}
