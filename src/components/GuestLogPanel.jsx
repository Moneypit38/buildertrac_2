import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Plus } from "lucide-react";
import { DeleteButton } from "@/components/GuestAdminParts";
import { LOG_TYPES, logType, formatWhen, nowParts } from "@/lib/logTypes";

// Job log for shared links. Team members and project managers can add entries; project managers can delete.
// Customers only ever see entries the owner chose to share, and can't add.
export default function GuestLogPanel({ project, canAdd, canDelete, onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Call");
  const [withWhom, setWithWhom] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const logs = [...(project.logs || [])].sort((a, b) => (b.occurred_at || b.created_date || "").localeCompare(a.occurred_at || a.created_date || ""));

  const submit = async () => {
    if (!summary.trim() || busy) return;
    setBusy(true);
    const n = nowParts();
    const ok = await onAdd({ type, with_whom: withWhom.trim(), summary: summary.trim(), occurred_at: `${n.date}T${n.time}` });
    setBusy(false);
    if (ok) { setSummary(""); setWithWhom(""); setType("Call"); setOpen(false); }
  };

  return (
    <div className="space-y-3">
      {canAdd && (open ? (
        <div className="bg-accent/40 border border-border rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {LOG_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={`inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border text-sm font-medium ${type === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
                <t.icon className="w-4 h-4" /> {t.id}
              </button>
            ))}
          </div>
          <Input className="h-11" placeholder="Who was it with?" value={withWhom} onChange={(e) => setWithWhom(e.target.value)} />
          <Textarea rows={4} className="text-sm" placeholder="What was discussed or decided?" value={summary} onChange={(e) => setSummary(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="h-11" disabled={!summary.trim() || busy} onClick={submit}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      ) : (
        <Button className="w-full h-12 gap-2 font-semibold" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Log a call or meeting</Button>
      ))}

      {logs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <ClipboardList className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{canAdd ? "Nothing logged yet." : "No updates yet."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => {
            const t = logType(l.type);
            const Icon = t.icon;
            return (
              <div key={l.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${t.color}`}><Icon className="w-3 h-3" /> {l.type}</span>
                      {l.with_whom && <span className="text-sm font-semibold">{l.with_whom}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatWhen(l.occurred_at, l.created_date)}{l.author_name ? ` · logged by ${l.author_name}` : ""}</p>
                  </div>
                  {canDelete && <DeleteButton onConfirm={() => onDelete(l.id)} />}
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap break-words">{l.summary}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
