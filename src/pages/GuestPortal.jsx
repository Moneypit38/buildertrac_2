import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList, Camera, FileText, MessageSquare, MapPin, ChevronLeft, Upload, Loader2,
  CheckCircle2, X, ExternalLink, Send, Link2Off, ArrowRight, HardHat,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteButton, AddTaskForm, TaskEditor, ProjectEditor, AddProjectForm } from "@/components/GuestAdminParts";

const STATUSES = ["Not Started", "In Progress", "Pending Approval", "Blocked", "Done"];
const statusStyle = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "Pending Approval": "bg-yellow-500/20 text-yellow-500",
  "Blocked": "bg-red-500/20 text-red-400",
  "Done": "bg-green-500/20 text-green-500",
};

// ---------- helpers ----------
const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// Shrink phone photos before sending so uploads are fast and stay under the size limit.
async function shrinkImage(file, maxSide = 1600, quality = 0.82) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return { file, type: file.type };
    return { file: blob, type: "image/jpeg", name: file.name.replace(/\.\w+$/, "") + ".jpg" };
  } catch {
    return { file, type: file.type }; // e.g. browser can't decode it — send as is
  }
}

async function call(token, action, extra = {}) {
  const res = await base44.functions.invoke("guestAccess", { token, action, ...extra });
  return res.data;
}

// Portfolio-admin actions: returns true when saved.
async function adminDo(token, action, extra, okMsg, reload) {
  try {
    const r = await call(token, action, extra);
    if (r?.error) throw new Error(r.error);
    if (okMsg) toast.success(okMsg);
    await reload();
    return true;
  } catch {
    toast.error("That didn't save. Please try again.");
    return false;
  }
}

const errorText = {
  file_too_large: "That file is too large (10 MB max).",
  images_only: "Please choose an image.",
  file_type_not_allowed: "That file type isn't supported.",
  not_allowed: "Your link doesn't allow that.",
};

// ---------- small pieces ----------
function Lightbox({ photo, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={photo.photo_url} alt={photo.title} className="w-full object-contain max-h-[60vh] bg-black" />
          <button onClick={onClose} className="absolute top-2 right-2 bg-black/60 rounded-lg p-1.5 text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-1 overflow-y-auto">
          <p className="font-semibold">{photo.title}</p>
          {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}
          {onDelete && <DeleteButton onConfirm={onDelete} className="-ml-1" />}
          <p className="text-xs text-muted-foreground">
            {photo.created_date?.slice(0, 10)}{photo.uploaded_by_guest ? ` · ${photo.uploaded_by_guest}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function TasksPanel({ project, canEdit, isAdmin, token, reload }) {
  const [busy, setBusy] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const roots = project.tasks.filter((t) => !t.parent_task_id);
  const kids = (id) => project.tasks.filter((t) => t.parent_task_id === id);
  roots.sort((a, b) => Number(a.completed) - Number(b.completed) || (a.due_date || "9999").localeCompare(b.due_date || "9999"));

  const setStatus = async (task, status) => {
    setBusy(task.id);
    try {
      const r = await call(token, "updateTask", { task_id: task.id, status });
      if (r?.error) throw new Error(r.error);
      await reload();
    } catch (e) {
      toast.error("Couldn't update the task. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (roots.length === 0 && !isAdmin) return <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>;

  const Row = ({ t, child }) => (
    <div className={`bg-card border border-border rounded-xl px-3 py-2.5 ${child ? "ml-5" : ""}`}>
      <div className="flex items-start gap-2">
        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${t.completed ? "text-green-500" : "text-muted-foreground/40"}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
          {t.due_date && <p className="text-[11px] text-muted-foreground mt-0.5">Due {t.due_date}</p>}
        </div>
        {canEdit ? (
          <select
            value={t.status || "Not Started"}
            disabled={busy === t.id}
            onChange={(e) => setStatus(t, e.target.value)}
            className={`text-[11px] rounded-md border border-border px-1.5 py-1 bg-background ${busy === t.id ? "opacity-50" : ""}`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${statusStyle[t.status] || statusStyle["Not Started"]}`}>{t.status || "Not Started"}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {roots.map((t) => (
        <div key={t.id} className="space-y-1.5">
          <Row t={t} />
          {kids(t.id).map((c) => <Row key={c.id} t={c} child />)}
        </div>
      ))}
    </div>
  );
}

function PhotosPanel({ project, token, reload }) {
  const [open, setOpen] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of files) {
      try {
        const small = await shrinkImage(f);
        const b64 = await readAsBase64(small.file);
        const r = await call(token, "addPhoto", {
          project_id: project.id,
          title: f.name.replace(/\.\w+$/, "").slice(0, 80) || "Photo",
          file_name: small.name || f.name,
          file_type: small.type || "image/jpeg",
          data_base64: b64,
        });
        if (r?.error) throw new Error(r.error);
        ok++;
      } catch (err) {
        toast.error(errorText[err.message] || "A photo couldn't be uploaded.");
      }
    }
    setUploading(false);
    if (ok) { toast.success(ok === 1 ? "Photo uploaded" : `${ok} photos uploaded`); await reload(); }
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
        {uploading ? "Uploading…" : "Add photos"}
      </Button>
      {project.photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {project.photos.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="aspect-square rounded-lg overflow-hidden bg-accent">
              {p.photo_url && <img src={p.photo_url} alt={p.title} className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      )}
      {open && <Lightbox photo={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function DocsPanel({ project, token, reload }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast.error(errorText.file_too_large);
    setUploading(true);
    try {
      const b64 = await readAsBase64(f);
      const r = await call(token, "addDoc", {
        project_id: project.id,
        name: f.name.replace(/\.\w+$/, "").slice(0, 100),
        file_name: f.name,
        file_type: f.type || "application/octet-stream",
        data_base64: b64,
      });
      if (r?.error) throw new Error(r.error);
      toast.success("Document uploaded");
      await reload();
    } catch (err) {
      toast.error(errorText[err.message] || "The document couldn't be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
        {uploading ? "Uploading…" : "Upload document"}
      </Button>
      {project.docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No documents yet.</p>
      ) : (
        <div className="space-y-2">
          {project.docs.map((d) => (
            <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">{d.category} · {d.size || "—"} · {d.created_date?.slice(0, 10)}{d.uploaded_by_guest ? ` · ${d.uploaded_by_guest}` : ""}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesPanel({ project, token, reload, guestName }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const notes = [...project.notes].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [notes.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const r = await call(token, "addNote", { project_id: project.id, content: draft.trim() });
      if (r?.error) throw new Error(r.error);
      setDraft("");
      await reload();
    } catch {
      toast.error("Message didn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ height: "55vh", minHeight: 320 }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>}
        {notes.map((n) => {
          const mine = guestName && n.author_name === guestName;
          return (
            <div key={n.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <p className="text-[11px] text-muted-foreground mb-0.5">{n.author_name || "Team"} · {n.created_date?.slice(0, 10)}</p>
              <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words max-w-[85%] ${mine ? "bg-primary text-primary-foreground" : "bg-accent"}`}>{n.content}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-2 flex gap-2 items-end bg-background">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder="Type a message…" className="flex-1 resize-none min-h-[40px] max-h-[110px] text-sm" />
        <Button size="icon" onClick={send} disabled={!draft.trim() || sending} className="h-10 w-10 shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function ProjectView({ project, role, token, reload, guestName }) {
  const isTeam = role === "team_member";
  const tabs = [
    { id: "tasks", label: "Tasks", icon: ClipboardList },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "docs", label: "Docs", icon: FileText },
    ...(isTeam ? [{ id: "messages", label: "Messages", icon: MessageSquare }] : []),
  ];
  const [tab, setTab] = useState("tasks");

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-lg font-bold font-display">{project.name}</h2>
        {project.address && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {project.address}</p>}
        {project.status && <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{project.status}</span>}
        {project.description && <p className="text-sm text-muted-foreground mt-2">{project.description}</p>}
      </div>

      <div className="flex bg-card border border-border rounded-lg p-0.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-md transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" && <TasksPanel project={project} canEdit={isTeam} token={token} reload={reload} />}
      {tab === "photos" && <PhotosPanel project={project} token={token} reload={reload} />}
      {tab === "docs" && <DocsPanel project={project} token={token} reload={reload} />}
      {tab === "messages" && isTeam && <MessagesPanel project={project} token={token} reload={reload} guestName={guestName} />}
    </div>
  );
}

// ---------- page ----------
export default function GuestPortal() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await call(token, "load");
      if (data?.error) throw new Error(data.error);
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState((s) => (s.data ? s : { loading: false, error: "invalid", data: null }));
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const { loading, error, data } = state;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <Link2Off className="w-10 h-10 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold font-display">This link isn't active</h1>
          <p className="text-sm text-muted-foreground">It may have expired or been turned off. Please ask the person who shared it to send you a new one.</p>
        </div>
      </div>
    );
  }

  const projects = data.projects || [];
  const single = projects.length === 1 ? projects[0] : null;
  const selected = single || projects.find((p) => p.id === selectedId) || null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b-2 border-primary" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}>
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold tracking-tight">Builder<span style={{ color: "#F5A623" }}>T</span>rac</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {data.owner_name ? `Shared by ${data.owner_name}` : "Shared with you"}{data.guest_name ? ` · ${data.guest_name}` : ""}
            </p>
          </div>
          {!single && selected && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1 text-primary"><ChevronLeft className="w-4 h-4" /> All projects</Button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {projects.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <HardHat className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">There are no projects to show yet.</p>
          </div>
        )}

        {!selected && projects.length > 0 && (
          <>
            {data.portfolio_name && <h1 className="text-xl font-bold font-display">{data.portfolio_name}</h1>}
            <div className="space-y-2">
              {projects.map((p) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.name}</p>
                    {p.address && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.address}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {selected && (
          <ProjectView key={selected.id} project={selected} role={data.role} token={token} reload={load} guestName={data.guest_name} />
        )}
      </main>

      <footer className="max-w-2xl w-full mx-auto px-4 pb-8 pt-2 text-center">
        <p className="text-xs text-muted-foreground">
          Run your own jobs the same way.{" "}
          <a href="https://mybuildertrac.base44.app" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Try BuilderTrac</a>
        </p>
      </footer>
    </div>
  );
}
