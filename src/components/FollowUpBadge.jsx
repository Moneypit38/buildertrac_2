import { Timer } from "lucide-react";
import { useAllLogEntries } from "@/hooks/useFollowUps";
import { planFor, countdown } from "@/lib/followUp";

const TONE = {
  due: "bg-orange-500/15 text-orange-400 border-orange-400/40",
  soon: "bg-yellow-300/15 text-yellow-300 border-yellow-300/40",
  later: "bg-accent text-muted-foreground border-border",
};

// Countdown to the next follow-up for one job. Shows nothing when reminders are off, snoozed or finished.
export default function FollowUpBadge({ project, className = "" }) {
  const { data: entries = [] } = useAllLogEntries();
  const plan = planFor(project, entries);
  if (!plan) return null;
  const c = countdown(plan);
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TONE[c.tone]} ${className}`}>
      <Timer className="w-3 h-3" /> {c.text}
    </span>
  );
}
