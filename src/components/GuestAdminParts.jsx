import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Plus, Loader2 } from "lucide-react";

// Small building blocks used only by portfolio-admin guests on the /g/<token> page.

// Two-tap delete so nothing disappears by accident.
export function DeleteButton({ onConfirm, className = "" }) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  if (sure) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Button type="button" size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={busy}
          onClick={async (e) => { e.stopPropagation(); setBusy(true); await onConfirm(); setBusy(false); setSure(false); }}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={(e) => { e.stopPropagation(); setSure(false); }}>No</Button>
      </span>
    );
  }
  return (
    <button type="button" aria-label="Delete" onClick={(e) => { e.stopPropagation(); setSure(true); }}
      className={`p-1 text-muted-foreground hover:text-destructive transition-colors ${className}`}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

export function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd({ title: title.trim(), due_date: due || undefined });
    setBusy(false);
    if (ok) { setTitle(""); setDue(""); }
  };
  return (
    <form onSubmit={submit} className="flex gap-2 items-center bg-accent/40 border border-border rounded-xl p-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" className="h-9 text-sm flex-1 min-w-0" />
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-9 text-xs w-[130px] shrink-0" />
      <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!title.trim() || busy}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </Button>
    </form>
  );
}

export function TaskEditor({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title || "");
  const [due, setDue] = useState(task.due_date || "");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
      <div className="flex gap-2">
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-9 text-xs flex-1" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 text-xs rounded-md border border-border bg-background px-2">
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!title.trim() || busy}
          onClick={async () => { setBusy(true); const ok = await onSave({ title: title.trim(), due_date: due, priority }); setBusy(false); if (ok) onCancel(); }}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function ProjectEditor({ project, onSave }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: project.name || "", address: project.address || "", status: project.status || "Planning" });
  const [busy, setBusy] = useState(false);
  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 mt-3" onClick={() => setOpen(true)}>
        <Pencil className="w-3 h-3" /> Edit project
      </Button>
    );
  }
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Project name" className="h-9 text-sm" />
      <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Site address" className="h-9 text-sm" />
      <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="h-9 w-full text-sm rounded-md border border-border bg-background px-2">
        {["Planning", "In Progress", "On Hold", "Completed"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!form.name.trim() || busy}
          onClick={async () => { setBusy(true); const ok = await onSave(form); setBusy(false); if (ok) setOpen(false); }}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function AddProjectForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [busy, setBusy] = useState(false);
  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Add project
      </Button>
    );
  }
  return (
    <div className="bg-accent/40 border border-border rounded-xl p-3 space-y-2">
      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Project name" className="h-9 text-sm" />
      <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Site address (optional)" className="h-9 text-sm" />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!form.name.trim() || busy}
          onClick={async () => { setBusy(true); const ok = await onAdd(form); setBusy(false); if (ok) { setForm({ name: "", address: "" }); setOpen(false); } }}>
          {busy ? "Adding…" : "Add project"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
