import { Phone, Users, HardHat, Mail, CheckCircle2 } from "lucide-react";

export const LOG_TYPES = [
  { id: "Call", icon: Phone, color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  { id: "Meeting", icon: Users, color: "text-purple-400 bg-purple-500/15 border-purple-500/30" },
  { id: "Site visit", icon: HardHat, color: "text-orange-400 bg-orange-500/15 border-orange-500/30" },
  { id: "Text/Email", icon: Mail, color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" },
  { id: "Decision", icon: CheckCircle2, color: "text-green-400 bg-green-500/15 border-green-500/30" },
];

export const logType = (id) => LOG_TYPES.find((t) => t.id === id) || LOG_TYPES[0];

// "2026-11-27T14:30" (local, no zone) -> a readable string.
export function formatWhen(occurred, fallback) {
  const d = occurred ? new Date(occurred) : fallback ? new Date(fallback) : null;
  if (!d || isNaN(d)) return "";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const nowParts = () => {
  const d = new Date();
  return { date: d.toLocaleDateString("en-CA"), time: d.toTimeString().slice(0, 5) };
};
