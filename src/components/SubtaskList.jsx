import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";

export default function SubtaskList({ parentTaskId, projectId }) {
  const qc = useQueryClient();
  const { data: subtasks = [] } = useQuery({
    queryKey: ["subtasks", parentTaskId],
    queryFn: () => base44.entities.Task.filter({ parent_task_id: parentTaskId }),
  });

  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const createSubtask = useMutation({
    mutationFn: (title) => base44.entities.Task.create({ title, project_id: projectId, parent_task_id: parentTaskId, section: "today" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subtasks", parentTaskId] }); setNewTitle(""); toast.success("Subtask added"); },
  });

  const toggleSubtask = useMutation({
    mutationFn: (st) => base44.entities.Task.update(st.id, { completed: !st.completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", parentTaskId] }),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createSubtask.mutate(newTitle.trim());
    setAdding(false);
  };

  return (
    <div style={{ marginTop: 8, paddingLeft: 16, borderLeft: "1px solid hsl(var(--border))" }}>
      {subtasks.map(st => (
        <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => toggleSubtask.mutate(st)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: `2px solid ${st.completed ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}`,
              backgroundColor: st.completed ? "hsl(var(--primary))" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {st.completed && <Check size={13} color="hsl(var(--primary-foreground))" strokeWidth={3} />}
          </div>
          <span style={{
            fontSize: 13,
            flex: 1,
            color: st.completed ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
            textDecoration: st.completed ? "line-through" : "none",
          }}>
            {st.title}
          </span>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0" }}>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onBlur={() => { if (!newTitle.trim()) setAdding(false); }}
            style={{ flex: 1, fontSize: 13, background: "hsl(var(--background))", border: "1px solid hsl(var(--input))", borderRadius: 6, padding: "4px 8px", outline: "none", color: "hsl(var(--foreground))" }}
            placeholder="Subtask title..."
          />
          <button type="submit" style={{ color: "hsl(var(--primary))", cursor: "pointer", background: "none", border: "none", padding: 4 }}>
            <Check size={14} />
          </button>
        </form>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setAdding(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0", fontSize: 12, color: "hsl(var(--muted-foreground))", cursor: "pointer", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <Plus size={12} /> Add subtask
        </div>
      )}
    </div>
  );
}