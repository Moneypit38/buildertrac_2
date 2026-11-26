import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pencil, Plus, Loader2, CalendarClock, MapPin, UserPlus, Copy, Share2, Power, Check, MessageSquare } from "lucide-react";

const smsHref = (url) => `sms:?&body=${encodeURIComponent(`Here's your BuilderTrac link (no account needed): ${url}\n\nIf it opens the BuilderTrac app instead, press and hold the link and choose Open in Safari.`)}`;
import { toast } from "sonner";
import DateInput from "@/components/DateInput";

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
      <DateInput value={due} onChange={(e) => setDue(e.target.value)} className="h-9 text-xs" wrapperClassName="w-[140px] shrink-0" />
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
        <DateInput value={form.due_date} onChange={set("due_date")} className="h-9 text-xs" wrapperClassName="flex-1" />
        <select value={form.priority} onChange={set("priority")} className="h-9 w-[92px] shrink-0 text-xs rounded-md border border-border bg-background px-2">
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

const roleName = (r) => (r === "team_member" ? "Team member" : "Customer");

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast.success("Link copied"); }
  catch { toast.error("Couldn't copy. Press and hold the link to copy it."); }
}

// Invite customers and team members (never other project managers) and manage their links.
export function ShareSection({ links = [], projects = [], defaultProjectId = "", onCreate, onToggle, onDelete, baseUrl }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ guest_name: "", guest_email: "", role: "customer", project_id: defaultProjectId });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const url = (t) => `${baseUrl}/g/${t}`;
  const shown = defaultProjectId ? links.filter((l) => l.scope === "portfolio" || l.project_id === defaultProjectId) : links;
  const projectName = (id) => projects.find((p) => p.id === id)?.name || "a project";

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setOpen(true)}>
        <UserPlus className="w-3 h-3" /> Invite people{shown.length ? ` (${shown.length})` : ""}
      </Button>
    );
  }

  return (
    <div className="bg-accent/40 border border-border rounded-xl p-3 space-y-3 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Invite customers &amp; team members</p>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setOpen(false); setCreated(null); }}>Close</Button>
      </div>

      {created && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-2.5 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5 text-primary" /> {created.emailed ? "Link emailed" : "Link ready — copy it and send it yourself"}</p>
          <p className="text-[11px] break-all bg-background rounded p-1.5 select-all">{created.url}</p>
          <Button type="button" size="sm" className="h-7 text-xs gap-1" onClick={() => copyText(created.url)}><Copy className="w-3 h-3" /> Copy</Button>
          <a href={smsHref(created.url)} className="ml-1.5"><Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"><MessageSquare className="w-3 h-3" /> Text</Button></a>
        </div>
      )}

      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.guest_name.trim() && !form.guest_email.trim()) return toast.error("Add a name or an email");
          setBusy(true);
          const res = await onCreate({ ...form, guest_name: form.guest_name.trim(), guest_email: form.guest_email.trim() });
          setBusy(false);
          if (res) { setCreated(res); setForm((f) => ({ ...f, guest_name: "", guest_email: "" })); }
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.guest_name} onChange={set("guest_name")} placeholder="Name" className="h-9 text-sm" />
          <Input type="email" value={form.guest_email} onChange={set("guest_email")} placeholder="Email (optional)" className="h-9 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.role} onChange={set("role")} className="h-9 text-sm rounded-md border border-border bg-background px-2">
            <option value="customer">Customer — view + upload</option>
            <option value="team_member">Team member</option>
          </select>
          <select value={form.project_id} onChange={set("project_id")} className="h-9 text-sm rounded-md border border-border bg-background px-2">
            <option value="">Whole portfolio</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={busy} className="w-full">{busy ? "Creating…" : form.guest_email.trim() ? "Create link & email it" : "Create link"}</Button>
      </form>

      {shown.length > 0 && (
        <div className="space-y-1.5">
          {shown.map((l) => (
            <div key={l.id} className={`bg-card border border-border rounded-lg px-2.5 py-2 ${l.active ? "" : "opacity-60"}`}>
              <p className="text-sm font-medium truncate">{l.guest_name || l.guest_email}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {roleName(l.role)} · {l.scope === "portfolio" ? "whole portfolio" : projectName(l.project_id)}{l.active ? (l.last_opened ? ` · opened ${l.last_opened.slice(0, 10)}` : " · not opened yet") : " · off"}
              </p>
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <Button type="button" size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1" onClick={() => copyText(url(l.token))}><Copy className="w-3 h-3" /> Copy</Button>
                <a href={smsHref(url(l.token))}><Button type="button" size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1"><MessageSquare className="w-3 h-3" /> Text</Button></a>
                {typeof navigator !== "undefined" && navigator.share && (
                  <Button type="button" size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1" onClick={() => navigator.share({ title: "BuilderTrac", url: url(l.token) }).catch(() => {})}><Share2 className="w-3 h-3" /> Send</Button>
                )}
                <Button type="button" size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1" onClick={() => onToggle(l)}><Power className="w-3 h-3" /> {l.active ? "Turn off" : "Turn on"}</Button>
                <DeleteButton onConfirm={() => onDelete(l)} />
              </div>
            </div>
          ))}
        </div>
      )}
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
            <DateInput value={form.date} onChange={set("date")} className="h-9 text-xs" wrapperClassName="flex-1" />
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
