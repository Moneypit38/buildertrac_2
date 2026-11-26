import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { callChat, isUnread } from "@/lib/chat";

// True when there are unread chat messages (or, for the owner, open alerts) in any team the user belongs to.
export function useChatBadge() {
  const { data } = useQuery({
    queryKey: ["chatBadge"],
    refetchInterval: 45000,
    staleTime: 30000,
    retry: false,
    queryFn: async () => {
      const jobs = await base44.entities.SharedJob.list().catch(() => []);
      const tokens = [null, ...jobs.filter((j) => j.role !== "customer").map((j) => j.token)];
      let flag = false;
      for (const token of tokens) {
        try {
          const who = await callChat(token, "who");
          if (!who?.allowed) continue;
          const inbox = await callChat(token, "inbox");
          if (inbox?.openFlags > 0) flag = true;
          if ((inbox?.threads || []).some((t) => isUnread(who.me.id, t))) flag = true;
        } catch { /* ignore */ }
      }
      return flag;
    },
  });
  return !!data;
}
