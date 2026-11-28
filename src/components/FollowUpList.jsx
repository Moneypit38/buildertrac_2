import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneCall, Clock, BellOff } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useFollowUps } from "@/hooks/useFollowUps";
import { encouragement, headline, snoozeDate } from "@/lib/followUp";

// Home card: jobs that are due for a follow-up, with a friendly nudge.
export default function FollowUpList() {
  const items = useFollowUps();
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success(v.msg); },
    onError: () => toast.error("Couldn't save that. Please try again."),
  });

  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
        <PhoneCall className="w-4 h-4" /> Time to follow up ({items.length})
      </h2>
      {items.slice(0, 3).map((f) => (
        <div key={f.project.id} className="bg-card border border-primary/40 rounded-xl p-3 space-y-2">
          <div>
            <p className="font-semibold text-sm truncate">{f.project.name}</p>
            <p className="text-[11px] text-muted-foreground">{headline(f)}</p>
          </div>
          <p className="text-xs text-muted-foreground">{encouragement(f)}</p>
          <div className="flex gap-2">
            <Link to={`/project/${f.project.id}?tab=log`} className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform">
              <PhoneCall className="w-4 h-4" /> Open and log
            </Link>
            <button type="button" aria-label="Snooze 3 days" disabled={update.isPending}
              onClick={() => update.mutate({ id: f.project.id, data: { follow_up_snoozed_until: snoozeDate(3) }, msg: "Snoozed for 3 days" })}
              className="inline-flex items-center justify-center gap-1 h-11 px-3 rounded-xl border border-border text-xs font-medium active:bg-accent">
              <Clock className="w-4 h-4" /> 3 days
            </button>
            <button type="button" aria-label="Stop reminders for this job" disabled={update.isPending}
              onClick={() => update.mutate({ id: f.project.id, data: { follow_up_off: true }, msg: "Reminders off for this job" })}
              className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border text-muted-foreground active:bg-accent">
              <BellOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {items.length > 3 && (
        <Link to="/report" className="block text-center text-xs text-primary font-semibold py-1">See all {items.length} in your report</Link>
      )}
    </section>
  );
}
