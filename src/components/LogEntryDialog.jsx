import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import DateInput from "@/components/DateInput";
import { toast } from "sonner";
import { LOG_TYPES, nowParts } from "@/lib/logTypes";

// Short form for logging a call, meeting, site visit, text/email or decision on a job.
export default function LogEntryDialog({ open, onClose, projectId, entry, defaultType }) {
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const [type, setType] = useState("Call");
  const [withWhom, setWithWhom] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [summary, setSummary] = useState("");
  const [share, setShare] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [fuTitle, setFuTitle] = useState("");
  const [fuDate, setFuDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      const [d, t] = (entry.occurred_at || "").split("T");
      setType(entry.type || "Call"); setWithWhom(entry.with_whom || ""); setDate(d || ""); setTime((t || "").slice(0, 5));
      setSummary(entry.summary || ""); setShare(!!entry.share_with_customer);
    } else {
      const n = nowParts();
      setType(defaultType || "Call"); setWithWhom(""); setDate(n.date); setTime(n.time); setSummary(""); setShare(false);
    }
    setFollowUp(false); setFuTitle(""); setFuDate("");
  }, [open, entry, defaultType]);

  const save = async () => {
    if (!summary.trim()) return toast.error("Add a few words about what was discussed");
    if (followUp && !fuTitle.trim()) return toast.error("Name the follow-up task");
    setSaving(true);
    try {
      const data = {
        type, with_whom: withWhom.trim(), summary: summary.trim(), share_with_customer: share,
        occurred_at: date ? `${date}T${time || "00:00"}` : "",
      };
      if (entry) {
        await base44.entities.LogEntry.update(entry.id, data);
      } else {
        const rec = await base44.entities.LogEntry.create({ ...data, project_id: projectId, author_name: me?.full_name || "", author_email: me?.email || "" });
        if (followUp) {
          const task = await base44.entities.Task.create({
            title: fuTitle.trim(), project_id: projectId, due_date: fuDate || undefined, priority: "medium", status: "Not Started", completed: false,
            description: `From ${type.toLowerCase()}${withWhom.trim() ? ` with ${withWhom.trim()}` : ""}`,
          });
          await base44.entities.LogEntry.update(rec.id, { follow_up_task_id: task.id });
          qc.invalidateQueries({ queryKey: ["tasks"] });
        }
      }
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success(entry ? "Entry updated" : "Logged");
      onClose();
    } catch {
      toast.error("Couldn't save. Try again.");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit entry" : "Log a call or meeting"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {LOG_TYPES.map((t) => {
              const Icon = t.icon;
              const on = type === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setType(t.id)}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border text-sm font-medium transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
                  <Icon className="w-4 h-4" /> {t.id}
                </button>
              );
            })}
          </div>
          <Input className="h-11" placeholder="Who was it with? (name or company)" value={withWhom} onChange={(e) => setWithWhom(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <DateInput className="h-11" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input className="h-11 min-w-0" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <Textarea rows={5} className="text-sm" placeholder="What was discussed or decided? (Tap the microphone on your keyboard to dictate.)" value={summary} onChange={(e) => setSummary(e.target.value)} />

          {!entry && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <label className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-sm font-medium">Add a follow-up task</span>
                <Switch checked={followUp} onCheckedChange={setFollowUp} />
              </label>
              {followUp && (
                <div className="space-y-2">
                  <Input className="h-11" placeholder="What needs to happen? (e.g. Send revised quote)" value={fuTitle} onChange={(e) => setFuTitle(e.target.value)} />
                  <DateInput className="h-11" placeholder="Due date" value={fuDate} onChange={(e) => setFuDate(e.target.value)} />
                </div>
              )}
            </div>
          )}

          <label className="flex items-center justify-between gap-3 min-h-[44px]">
            <span className="text-sm">
              <span className="font-medium">Show to customer</span>
              <span className="block text-xs text-muted-foreground">Off by default. Only you and your team see it.</span>
            </span>
            <Switch checked={share} onCheckedChange={setShare} />
          </label>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="outline" className="h-11" onClick={onClose}>Cancel</Button>
            <Button className="h-11" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
