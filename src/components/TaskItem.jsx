import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, ChevronDown, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { isNew } from "../hooks/useLastViewed";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const PRIORITIES = ["low", "medium", "high"];

const priorityConfig = {
  high:   { label: "HIGH", bg: "bg-red-500",    text: "text-white" },
  medium: { label: "MED",  bg: "bg-yellow-500", text: "text-black" },
  low:    { label: "LOW",  bg: "bg-green-500",  text: "text-white" },
};

export default function TaskItem({ task, onExpand, expanded, onEdit }) {
  const qc = useQueryClient();
  const isNewTask = isNew(task.created_date, "tasks");
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completed && task.due_date && task.due_date <= todayStr;
  const currentPriority = task.priority || "medium";
  const pCfg = priorityConfig[currentPriority] || priorityConfig.medium;

  // Invalidate both the global and per-project task caches
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks"], exact: false });
  };

  const toggle = useMutation({
    mutationFn: () => base44.entities.Task.update(task.id, { completed: !task.completed }),
    onSuccess: () => {
      invalidate();
      toast.success(task.completed ? "Task reopened" : "Task completed!");
    },
  });

  const cyclePriority = useMutation({
    mutationFn: () => {
      const next = PRIORITIES[(PRIORITIES.indexOf(currentPriority) + 1) % PRIORITIES.length];
      return base44.entities.Task.update(task.id, { priority: next });
    },
    onSuccess: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: () => { invalidate(); toast.success("Task removed"); },
  });

  return (
    <div className={`bg-card border rounded-xl overflow-hidden ${isOverdue ? "border-orange-400/70" : "border-border"}`}>
      <div className="flex items-stretch">

        {/* ── Complete button: full-height, generous tap target ── */}
        <button
          type="button"
          onPointerUp={(e) => { e.stopPropagation(); if (!toggle.isPending) toggle.mutate(); }}
          className={`flex items-center justify-center w-16 shrink-0 transition-colors active:opacity-70 ${
            task.completed ? "bg-primary" : "bg-card hover:bg-accent"
          }`}
          style={{ minHeight: 64, touchAction: "manipulation" }}
        >
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed
              ? "bg-primary-foreground border-primary-foreground"
              : isOverdue
                ? "border-orange-400"
                : "border-muted-foreground/40"
          }`}>
            {task.completed && <Check className="w-5 h-5 text-primary" strokeWidth={3} />}
            {toggle.isPending && (
              <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </button>

        {/* ── Task content ── */}
        <div className="flex-1 min-w-0 px-3 py-3">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </p>
            {isNewTask && !task.completed && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
            )}
          </div>
          {task.due_date && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${isOverdue ? "text-orange-400 font-semibold" : "text-muted-foreground"}`}>
              <Calendar className="w-3 h-3" />
              {task.due_date}{isOverdue ? " · Overdue" : ""}
            </p>
          )}
          {task.assigned_to && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.assigned_to}</p>
          )}
        </div>

        {/* ── Right controls ── */}
        <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 shrink-0">

          {/* Priority cycle */}
          <button
            type="button"
            onPointerUp={(e) => { e.stopPropagation(); if (!cyclePriority.isPending) cyclePriority.mutate(); }}
            className={`${pCfg.bg} ${pCfg.text} text-[10px] font-bold rounded-md px-2 py-1 min-w-[44px] min-h-[32px] flex items-center justify-center active:opacity-70 transition-opacity`}
            style={{ touchAction: "manipulation" }}
            title="Tap to change priority"
          >
            {pCfg.label}
          </button>

          <div className="flex items-center gap-0.5 mt-1">
            {onEdit && (
              <button
                type="button"
                onPointerUp={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary active:opacity-70 transition-all rounded"
                style={{ touchAction: "manipulation" }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onExpand && (
              <button
                type="button"
                onPointerUp={(e) => { e.stopPropagation(); onExpand(); }}
                className={`w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary active:opacity-70 transition-all rounded ${expanded ? "rotate-180" : ""}`}
                style={{ touchAction: "manipulation" }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive active:opacity-70 transition-all rounded"
                  style={{ touchAction: "manipulation" }}
                >
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

      </div>
    </div>
  );
}