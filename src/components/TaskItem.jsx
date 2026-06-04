import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Trash2, ChevronDown, Pencil, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { isNew } from "../hooks/useLastViewed";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const PRIORITIES = ["low", "medium", "high"];

const priorityConfig = {
  high:   { label: "HIGH",   classes: "bg-red-500 text-white border-red-500" },
  medium: { label: "MED",    classes: "bg-yellow-500 text-black border-yellow-500" },
  low:    { label: "LOW",    classes: "bg-green-500 text-white border-green-500" },
};

const statusStyles = {
  "Not Started":      "bg-muted text-muted-foreground border-border",
  "In Progress":      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Pending Approval": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Blocked":          "bg-red-500/15 text-red-400 border-red-500/30",
  "Done":             "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function TaskItem({ task, onExpand, expanded, onEdit }) {
  const qc = useQueryClient();
  const isNewTask = isNew(task.created_date, "tasks");
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completed && task.due_date && task.due_date <= todayStr;
  const currentPriority = task.priority || "medium";

  const toggle = useMutation({
    mutationFn: () => base44.entities.Task.update(task.id, { completed: !task.completed }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks"]);
      qc.setQueryData(["tasks"], (old = []) =>
        old.map(t => t.id === task.id ? { ...t, completed: !task.completed } : t)
      );
      return { prev };
    },
    onError: (_, __, ctx) => { if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["tasks"], exact: false }); },
    onSuccess: () => { toast.success(task.completed ? "Task reopened" : "Task completed!"); },
  });

  const cyclePriority = useMutation({
    mutationFn: (newPriority) => base44.entities.Task.update(task.id, { priority: newPriority }),
    onMutate: async (newPriority) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks"]);
      qc.setQueryData(["tasks"], (old = []) =>
        old.map(t => t.id === task.id ? { ...t, priority: newPriority } : t)
      );
      return { prev };
    },
    onError: (_, __, ctx) => { if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["tasks"], exact: false }); },
  });

  const remove = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"], exact: false }); toast.success("Task removed"); },
  });

  const handleCyclePriority = (e) => {
    e.stopPropagation();
    const nextIndex = (PRIORITIES.indexOf(currentPriority) + 1) % PRIORITIES.length;
    cyclePriority.mutate(PRIORITIES[nextIndex]);
  };

  const pConfig = priorityConfig[currentPriority] || priorityConfig.medium;

  return (
    <div className={`bg-card border rounded-xl flex items-stretch gap-0 group hover:border-primary/30 transition-all overflow-hidden ${isOverdue ? "border-orange-400/60" : "border-border"}`}>

      {/* Large tap-friendly complete button — left side */}
      <button
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className={`flex items-center justify-center w-14 shrink-0 transition-all duration-200 active:scale-95 ${
          task.completed
            ? "bg-primary text-primary-foreground"
            : "bg-background hover:bg-primary/10 text-muted-foreground"
        }`}
        title={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? "bg-primary border-primary"
            : isOverdue
              ? "border-orange-400"
              : "border-muted-foreground/50"
        }`}>
          {task.completed && <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />}
        </div>
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0 py-3 pr-2">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </p>
          {isNewTask && !task.completed && (
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" title="New task" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.due_date && (
            <p className={`text-[11px] flex items-center gap-1 ${isOverdue ? "text-orange-400 font-medium" : "text-muted-foreground"}`}>
              <Calendar className="w-3 h-3" /> {task.due_date}{isOverdue ? " • Overdue" : ""}
            </p>
          )}
          {task.status && task.status !== "Not Started" && (
            <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyles[task.status] || ""}`}>
              {task.status}
            </Badge>
          )}
          {task.assigned_to && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:block">{task.assigned_to}</span>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 pr-2 shrink-0">
        {/* Priority cycle button — large tap target */}
        <button
          onClick={handleCyclePriority}
          disabled={cyclePriority.isPending}
          title="Tap to change priority"
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border text-[11px] font-bold transition-all active:scale-95 ${pConfig.classes}`}
        >
          {pConfig.label}
        </button>

        {onEdit && (
          <button onClick={onEdit} className="min-h-[44px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onExpand && (
          <button onClick={onExpand} className={`min-h-[44px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-primary transition-all ${expanded ? "rotate-180" : ""}`}>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="min-h-[44px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete task?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove "{task.title}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}