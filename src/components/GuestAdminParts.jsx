import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pencil, Plus, Loader2, CalendarClock, MapPin } from "lucide-react";

// Building blocks used only by project managers on the /g/<token> page.

// Two-tap delete so nothing disappears by accident.
export function DeleteButton({ onConfirm, className = "", label }) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  if (sure) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Button type="button" size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={busy}
          onClick={async (e) => { e.preventDefault(); e.stopPropagation(); setBusy(true); await onConfirm(); setBusy(false); setSure(false); }}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, delete"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSure(false); }}>No</Button>
      </span>
    );
  }
  return (
    <button type="button" aria-label="Delete" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSure(true); }}
      className={`inline-flex items-center gap-1 p-1 text-muted-foreground hover:text-destructive transition-colors ${className}`}>
      <Trash2 className="w-3.5 h-3.5" />{label && <span className="text-xs">{label}</span>}
    </button>
  );
}

export function AddTaskForm({ onAdd, placeholder = "Add a task…" }) {
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
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} className="h-9 text-sm flex-1 min-w-0" />
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-9 text-xs w-[130px] shrink-0" />
      <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!title.trim() || busy}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </Button>
    </form>
  );
}

export function TaskEditor({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title || "", description: task.description || "", due_date: task.due_date || "",
    priority: task.priority || "medium", assigned_to: task.assigned_to || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      <Input value={form.title} onChange={set("title")} className="h-9 text-sm" placeholder="Task title" />
      <Textarea value={form.description} onChange={set("description")} rows={2} className="text-sm" placeholder="Details (optional)" />
      <Input value={form.assigned_to} onChange={set("assigned_to")} className="h-9 text-sm" placeholder="Assigned to (name or email)" />
      <div className="flex gap-2">
        <Input type="date" value={form.due_date} onChange={set("due_date")} className="h-9 text-xs flex-1" />
        <select value={form.priority} onChange={set("priority")} className="h-9 text-xs rounded-md border border-border bg-background px-2">
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!form.title.trim() || busy}
          onClick={async () => { setBusy(true); const ok = await onSave({ ...form, title: form.title.trim() }); setBusy(false); if (ok) onCancel(); }}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

const PROJECT_STATUSES = ["Planning", "In Progress", "On Hold", "Completed"];

export function ProjectEditor({ project, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: project.name || "", address: project.address || "", status: project.status || "Planning",
    description: project.description || "",
    budget_total: project.budget_total ?? 0, budget_spent: project.budget_spent ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 mt-3" onClick={() => setOpen(true)}>
        <Pencil className="w-3 h-3" /> Edit project
      </Button>
    );
  }
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <Input value={form.name} onChange={set("name")} placeholder="Project name" className="h-9 text-sm" />
      <Input value={form.address} onChange={set("address")} placeholder="Site address" className="h-9 text-sm" />
      <Textarea value={form.description} onChange={set("description")} rows={2} placeholder="Description" className="text-sm" />
      <select value={form.status} onChange={set("status")} className="h-9 w-full text-sm rounded-md border border-border bg-background px-2">
        {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[11px] text-muted-foreground mb-1">Budget ($)</p><Input type="number" min="0" value={form.budget_total} onChange={set("budget_total")} className="h-9 text-sm" /></div>
        <div><p className="text-[11px] text-muted-foreground mb-1">Spent ($)</p><Input type="number" min="0" value={form.budget_spent} onChange={set("budget_spent")} className="h-9 text-sm" /></div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" size="sm" disabled={!form.name.trim() || busy}
          onClick={async () => {
            setBusy(true);
            const ok = await onSave({ ...form, name: form.name.trim(), budget_total: Number(form.budget_total) || 0, budget_spent: Number(form.budget_spent) || 0 });
            setBusy(false);
            if (ok) setOpen(false);
          }}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        {onDelete && <DeleteButton onConfirm={onDelete} label="Delete project" className="ml-auto" />}
      </div>
    </div>
  );
}

export function AddProjectForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", budget_total: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Add project
      </Button>
    );
  }
  return (
    <div className="bg-accent/40 border border-border rounded-xl p-3 space-y-2">
      <Input value={form.name} onChange={set("name")} placeholder="Project name" className="h-9 text-sm" />
      <Input value={form.address} onChange={set("address")} placeholder="Site address (optional)" className="h-9 text-sm" />
      <Input type="number" min="0" value={form.budget_total} onChange={set("budget_total")} placeholder="Budget $ (optional)" className="h-9 text-sm" />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!form.name.trim() || busy}
          onClick={async () => {
            setBusy(true);
            const ok = await onAdd({ ...form, name: form.name.trim(), budget_total: Number(form.budget_total) || 0 });
            setBusy(false);
            if (ok) { setForm({ name: "", address: "", budget_total: "" }); setOpen(false); }
          }}>
          {busy ? "Adding…" : "Add project"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function PortfolioEditor({ portfolio, onSave }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: portfolio.description || "", contact_name: portfolio.contact_name || "",
    contact_email: portfolio.contact_email || "", contact_phone: portfolio.contact_phone || "",
    business_address: portfolio.business_address || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setOpen(true)}>
        <Pencil className="w-3 h-3" /> Edit portfolio details
      </Button>
    );
  }
  return (
    <div className="bg-accent/40 border border-border rounded-xl p-3 space-y-2">
      <Textarea value={form.description} onChange={set("description")} rows={2} placeholder="Description" className="text-sm" />
      <Input value={form.contact_name} onChange={set("contact_name")} placeholder="Contact name" className="h-9 text-sm" />
      <Input type="email" value={form.contact_email} onChange={set("contact_email")} placeholder="Contact email" className="h-9 text-sm" />
      <Input type="tel" value={form.contact_phone} onChange={set("contact_phone")} placeholder="Contact phone" className="h-9 text-sm" />
      <Input value={form.business_address} onChange={set("business_address")} placeholder="Business address" className="h-9 text-sm" />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={busy}
          onClick={async () => { setBusy(true); const ok = await onSave(form); setBusy(false); if (ok) setOpen(false); }}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function AppointmentsPanel({ project, canManage, onAdd, onDelete }) {
  const [form, setForm] = useState({ title: "", date: "", start_time: "", location: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const appts = [...(project.appointments || [])].sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.start_time || "").localeCompare(b.start_time || ""));
  return (
    <div className="space-y-3">
      {canManage && (
        <form
          className="bg-accent/40 border border-border rounded-xl p-3 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.date || busy) return;
            setBusy(true);
            const ok = await onAdd({ ...form, title: form.title.trim() });
            setBusy(false);
            if (ok) setForm({ title: "", date: "", start_time: "", location: "" });
          }}
        >
          <Input value={form.title} onChange={set("title")} placeholder="Appointment title" className="h-9 text-sm" />
          <div className="flex gap-2">
            <Input type="date" value={form.date} onChange={set("date")} className="h-9 text-xs flex-1" />
            <Input type="time" value={form.start_time} onChange={set("start_time")} className="h-9 text-xs w-[110px]" />
          </div>
          <Input value={form.location} onChange={set("location")} placeholder="Location (optional)" className="h-9 text-sm" />
          <Button type="submit" size="sm" disabled={!form.title.trim() || !form.date || busy}>{busy ? "Adding…" : "Add appointment"}</Button>
        </form>
      )}
      {appts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No appointments yet.</p>
      ) : (
        <div className="space-y-2">
          {appts.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-start gap-3">
              <CalendarClock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.date}{a.start_time ? ` · ${a.start_time}` : ""}{a.end_time ? `–${a.end_time}` : ""}</p>
                {a.location && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location}</p>}
                {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
              </div>
              {canManage && <DeleteButton onConfirm={() => onDelete(a.id)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
