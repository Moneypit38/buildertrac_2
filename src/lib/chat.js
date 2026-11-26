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

// ---- New-message chime (only while the app is open) ----
// Phones only allow sound after the person has touched the screen once, so we unlock on the first tap.
let ctx = null;
let lastChime = 0;

function getCtx() {
  if (!ctx && typeof window !== "undefined") {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

if (typeof window !== "undefined") {
  ["pointerdown", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, unlockAudio, { passive: true }));
}

export function playChime() {
  const now = Date.now();
  if (now - lastChime < 3000) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;
  lastChime = now;
  const note = (freq, start, dur) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
  };
  note(880, 0, 0.18);
  note(1320, 0.16, 0.28);
}
