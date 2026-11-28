import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { callChat, isUnread, playChime } from "@/lib/chat";

let knownUnread = null; // signatures of unread conversations we've already seen (null until the first check)

// True when there are unread chat messages (or, for the owner, open alerts) in any team the user belongs to.
// Plays a short chime when a new message arrives while the app is open.
function useChatState() {
  return useQuery({
    queryKey: ["chatBadge"],
    refetchInterval: 15000,
    staleTime: 10000,
    retry: false,
    queryFn: async () => {
      const jobs = await base44.entities.SharedJob.list().catch(() => []);
      const tokens = [null, ...jobs.filter((j) => j.role !== "customer").map((j) => j.token)];
      let flag = false;
      const dms = []; // unread direct messages, for the Home alert
      const sigs = new Set();
      for (const token of tokens) {
        try {
          const who = await callChat(token, "who");
          if (!who?.allowed) continue;
          const inbox = await callChat(token, "inbox");
          if (inbox?.openFlags > 0) { flag = true; sigs.add(`${token || "me"}|flags|${inbox.openFlags}`); }
          for (const t of inbox?.threads || []) {
            if (isUnread(who.me.id, t)) {
              flag = true;
              sigs.add(`${token || "me"}|${t.key}|${t.last_at}`);
              if (t.key.startsWith("dm|")) {
                const withId = t.key.slice(3);
                const person = (who.people || []).find((p) => p.id === withId);
                dms.push({ token, withId, name: person?.name || "a teammate", last_at: t.last_at });
              }
            }
          }
        } catch { /* ignore */ }
      }
      if (knownUnread !== null) {
        for (const s of sigs) { if (!knownUnread.has(s)) { playChime(); break; } }
      }
      knownUnread = sigs;
      dms.sort((a, b) => String(b.last_at).localeCompare(String(a.last_at)));
      return { flag, dms };
    },
  });
}

export function useChatBadge() {
  const { data } = useChatState();
  return !!data?.flag;
}

// Unread direct messages, newest first. Shared query with the badge, so no extra requests.
export function useUnreadDMs() {
  const { data } = useChatState();
  return data?.dms || [];
}
