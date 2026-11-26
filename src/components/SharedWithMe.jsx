import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, ArrowRight, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLE = { customer: "Customer", team_member: "Team member", project_manager: "Project manager" };
const TOKEN_RE = /([a-f0-9]{48})/i;

// Jobs other people shared with this signed-in user through a guest link.
export default function SharedWithMe() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ["sharedJobs"],
    queryFn: () => base44.entities.SharedJob.list(),
  });

  const add = async (e) => {
    e.preventDefault();
    const m = text.match(TOKEN_RE);
    if (!m) return toast.error("That doesn't look like a BuilderTrac invite link.");
    const token = m[1].toLowerCase();
    if (jobs.some((j) => j.token === token)) { setText(""); setAdding(false); return toast.message("Already added"); }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("guestAccess", { token, action: "load" });
      const d = res?.data ?? res;
      if (!d || d.error) throw new Error("invalid");
      const names = (d.projects || []).map((p) => p.name);
      const label = d.portfolio_name || (names.length === 1 ? names[0] : names[0] ? `${names[0]} +${names.length - 1}` : "Shared job");
      await base44.entities.SharedJob.create({ token, label, owner_name: d.owner_name || "", role: d.role });
      await qc.invalidateQueries({ queryKey: ["sharedJobs"] });
      setText(""); setAdding(false);
      toast.success("Added to your app");
    } catch {
      toast.error("That link isn't active. Ask for a new one.");
    }
    setBusy(false);
  };

  const remove = async (j) => {
    await base44.entities.SharedJob.delete(j.id);
    qc.invalidateQueries({ queryKey: ["sharedJobs"] });
    toast.success("Removed");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Share2 className="w-4 h-4 text-primary shrink-0" />
          <h2 className="text-sm font-bold font-display">Shared with me</h2>
        </div>
        {!adding && (
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3" /> Add shared job
          </Button>
        )}
      </div>

      {adding && (
        <form onSubmit={add} className="space-y-2">
          <p className="text-xs text-muted-foreground">Paste the invite link someone sent you. The job will open right here in your app.</p>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste invite link" className="h-9 text-sm" autoFocus />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !text.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setText(""); }}>Cancel</Button>
          </div>
        </form>
      )}

      {jobs.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground">Got an invite link from a contractor or customer? Add it here to open it in your app.</p>
      )}

      {jobs.map((j) => (
        <div key={j.id} className="flex items-center gap-2 bg-background border border-border rounded-xl pl-3 pr-1 py-2">
          <button type="button" className="flex-1 min-w-0 text-left flex items-center gap-2" onClick={() => navigate(`/shared/${j.token}`)}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{j.label || "Shared job"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{j.owner_name ? `Shared by ${j.owner_name} · ` : ""}{ROLE[j.role] || "Guest"}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => remove(j)} aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}
