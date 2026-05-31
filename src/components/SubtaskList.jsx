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
    <div className="mt-2 pl-4 border-l border-border space-y-1.5">
      {subtasks.map(st => (
        <div key={st.id} className="flex items-center gap-2 group">
          <button onClick={() => toggleSubtask.mutate(st)}
            className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${st.completed ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary/60"}`}>
            {st.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </button>
          <span className={`text-xs flex-1 ${st.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{st.title}</span>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-1">
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onBlur={() => { if (!newTitle.trim()) setAdding(false); }}
            className="flex-1 text-xs bg-background border border-input rounded px-2 py-1 outline-none focus:border-primary"
            placeholder="Subtask title..." />
          <button type="submit" className="text-primary hover:text-primary/80"><Check className="w-3.5 h-3.5" /></button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Plus className="w-3 h-3" /> Add subtask
        </button>
      )}
    </div>
  );
}