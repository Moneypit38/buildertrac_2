import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useAllLogEntries } from "@/hooks/useFollowUps";
import { planFor } from "@/lib/followUp";
import { nowParts } from "@/lib/logTypes";
import { celebrate } from "@/lib/celebrate";

const HOW = ["Call", "Text/Email", "Meeting"];

// One-tap "I followed up": pick how, it's logged as contact (which resets the countdown), then a celebration.
export default function FollowUpDone({ project, className = "" }) {
  const qc = useQueryClient();
  const { data: entries = [] } = useAllLogEntries();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const [open, setOpen] = useState(false);
  const plan = planFor(project, entries);

  const save = useMutation({
    mutationFn: (type) => {
      const n = nowParts();
      return base44.entities.LogEntry.create({
        project_id: project.id, type, summary: `Follow-up completed (${type.toLowerCase()}).`,
        occurred_at: `${n.date}T${n.time}`, share_with_customer: false,
        author_name: me?.full_name || "", author_email: me?.email || "",
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logs"] }); setOpen(false); celebrate(); },
    onError: () => toast.error("Couldn't save that. Please try again."),
  });

  if (!plan) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-green-500/50 bg-green-500/10 text-green-500 text-sm font-semibold active:scale-[0.98] transition-transform ${className}`}>
        <Check className="w-4 h-4" /> Followed up
      </button>
    );
  }
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-xs text-muted-foreground mr-0.5">How?</span>
      {HOW.map((h) => (
        <button key={h} type="button" disabled={save.isPending} onClick={() => save.mutate(h)}
          className="h-11 px-3 rounded-xl bg-green-500 text-white text-xs font-semibold active:scale-[0.97] disabled:opacity-60">
          {h}
        </button>
      ))}
      <button type="button" aria-label="Cancel" onClick={() => setOpen(false)} className="h-11 w-11 inline-flex items-center justify-center rounded-xl text-muted-foreground active:bg-accent">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
