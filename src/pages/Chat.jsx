import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ChatHub from "@/components/ChatHub";

// Chat for the signed-in user: their own team, plus the teams of any jobs shared with them.
export default function Chat() {
  const { data: jobs = [] } = useQuery({ queryKey: ["sharedJobs"], queryFn: () => base44.entities.SharedJob.list(), retry: false });
  const sources = [
    { key: "mine", label: "My team", token: null, owner: true },
    ...jobs.filter((j) => j.role !== "customer").map((j) => ({ key: j.id, label: j.owner_name ? `${j.owner_name}'s team` : j.label || "Shared team", token: j.token, owner: false })),
  ];
  const [sel, setSel] = useState("mine");
  const src = sources.find((s) => s.key === sel) || sources[0];

  // Arriving from the Home alert: jump to the right team, then straight into that direct message.
  const openDm = useLocation().state?.openDm || null;
  const target = openDm ? (openDm.token ? jobs.find((j) => j.token === openDm.token)?.id : "mine") : null;
  useEffect(() => { if (target) setSel(target); }, [target]);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <p className="text-xs text-muted-foreground font-medium">Your Team /</p>
        <h1 className="text-2xl font-extrabold font-display">Chat</h1>
      </div>
      {sources.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sources.map((s) => (
            <button key={s.key} onClick={() => setSel(s.key)}
              className={`px-4 min-h-[44px] rounded-xl text-sm font-medium whitespace-nowrap transition-all ${src.key === s.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <ChatHub key={src.key} token={src.token} isOwner={src.owner} openDm={openDm && (openDm.token || null) === src.token ? openDm : null} />
    </div>
  );
}
