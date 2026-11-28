import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ClipboardList, Eye, ListChecks } from "lucide-react";
import { toast } from "sonner";
import RowMenu from "@/components/RowMenu";
import LogEntryDialog from "@/components/LogEntryDialog";
import AppointmentsTab from "@/components/AppointmentsTab";
import { LOG_TYPES, logType, formatWhen } from "@/lib/logTypes";

export const useLogEntries = (projectId) =>
  useQuery({ queryKey: ["logs", projectId], queryFn: () => base44.entities.LogEntry.filter({ project_id: projectId }, "-created_date", 500) });

const sortKey = (e) => e.occurred_at || e.created_date || "";

export default function LogTab({ projectId, tasks = [], highlightApptId, onLog }) {
  const qc = useQueryClient();
  const { data: entries = [], isLoading } = useLogEntries(projectId);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);

  const del = useMutation({
    mutationFn: (id) => base44.entities.LogEntry.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logs"] }); toast.success("Entry deleted"); },
  });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...entries]
      .filter((e) => filter === "All" || e.type === filter)
      .filter((e) => !needle || [e.summary, e.with_whom, e.author_name].some((s) => (s || "").toLowerCase().includes(needle)))
      .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  }, [entries, filter, q]);

  const taskById = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks]);

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={onLog}><Plus className="w-4 h-4 mr-1" /> Log a call or meeting</Button>

      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="h-11 pl-9" placeholder="Search the log" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...LOG_TYPES.map((t) => t.id)].map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 min-h-[36px] rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filter === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No history yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log calls, meetings and decisions here so there's a record of what was said and when.</p>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nothing matches.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((e) => {
            const t = logType(e.type);
            const Icon = t.icon;
            const fu = e.follow_up_task_id ? taskById[e.follow_up_task_id] : null;
            const edited = e.updated_date && e.created_date && new Date(e.updated_date) - new Date(e.created_date) > 60000;
            return (
              <div key={e.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${t.color}`}><Icon className="w-3 h-3" /> {e.type}</span>
                      {e.with_whom && <span className="text-sm font-semibold truncate">{e.with_whom}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatWhen(e.occurred_at, e.created_date)}{e.author_name ? ` · logged by ${e.author_name}` : ""}{edited ? " · edited" : ""}
                    </p>
                  </div>
                  <RowMenu onEdit={() => setEdit(e)} onDelete={() => del.mutate(e.id)} editLabel="Edit entry" deleteLabel="Delete entry" deleteTitle="Delete this entry?" deleteText="This removes it from the job's history. This cannot be undone." />
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap break-words">{e.summary}</p>
                {(fu || e.share_with_customer) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fu && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent text-foreground">
                        <ListChecks className="w-3 h-3" /> Follow-up: {fu.title}{fu.due_date ? ` (due ${fu.due_date})` : ""}{fu.completed || fu.status === "Done" ? " ✓" : ""}
                      </span>
                    )}
                    {e.share_with_customer && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground"><Eye className="w-3 h-3" /> Customer can see this</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Appointments</h3>
        <AppointmentsTab projectId={projectId} canDelete={true} highlightApptId={highlightApptId} />
      </div>

      {edit && <LogEntryDialog open={!!edit} onClose={() => setEdit(null)} projectId={projectId} entry={edit} />}
    </div>
  );
}
