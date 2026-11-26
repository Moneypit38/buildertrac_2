import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TOKEN_RE = /([a-f0-9]{48})/i;

// Paste an invite link to bring a shared portfolio or project into this app.
// It then shows up in the Portfolios and Projects tabs like the user's own.
export default function AddSharedJobDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ["sharedJobs"],
    queryFn: () => base44.entities.SharedJob.list(),
  });

  const close = () => { setText(""); onClose(); };

  const add = async (e) => {
    e.preventDefault();
    const m = text.match(TOKEN_RE);
    if (!m) return toast.error("That doesn't look like a BuilderTrac invite link.");
    const token = m[1].toLowerCase();
    if (jobs.some((j) => j.token === token)) { close(); return toast.message("Already in your app"); }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("guestAccess", { token, action: "load" });
      const d = res?.data ?? res;
      if (!d || d.error) throw new Error("invalid");
      const names = (d.projects || []).map((p) => p.name);
      const label = d.portfolio_name || (names.length === 1 ? names[0] : names[0] ? `${names[0]} +${names.length - 1}` : "Shared job");
      await base44.entities.SharedJob.create({ token, label, owner_name: d.owner_name || "", role: d.role });
      await qc.invalidateQueries({ queryKey: ["sharedJobs"] });
      toast.success("Added to your app");
      close();
    } catch {
      toast.error("That link isn't active. Ask for a new one.");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add a shared portfolio or project</DialogTitle></DialogHeader>
        <form onSubmit={add} className="space-y-3">
          <p className="text-sm text-muted-foreground">Paste the invite link you were sent. It will appear with your portfolios and projects.</p>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste invite link" autoFocus />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={busy || !text.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
