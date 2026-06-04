import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, ChevronDown, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { isNew } from "../hooks/useLastViewed";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRIORITIES = ["low", "medium", "high"];
const priorityConfig = {
  high:   { label: "HIGH", bg: "#ef4444", text: "#fff" },
  medium: { label: "MED",  bg: "#eab308", text: "#000" },
  low:    { label: "LOW",  bg: "#22c55e", text: "#fff" },
};

const tapStyle = {
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  userSelect: "none",
  cursor: "pointer",
};

export default function TaskItem({ task, onExpand, expanded, onEdit }) {
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const isNewTask = isNew(task.created_date, "tasks");
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completed && task.due_date && task.due_date <= todayStr;
  const currentPriority = task.priority || "medium";
  const pCfg = priorityConfig[currentPriority] || priorityConfig.medium;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"], exact: false });

  const toggle = useMutation({
    mutationFn: () => base44.entities.Task.update(task.id, { completed: !task.completed }),
    onSuccess: () => { invalidate(); toast.success(task.completed ? "Task reopened" : "Task completed!"); },
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
    <>
      <div style={{
        backgroundColor: "hsl(var(--card))",
        border: `1px solid ${isOverdue ? "rgb(251 146 60 / 0.7)" : "hsl(var(--border))"}`,
        borderRadius: "0.75rem",
        overflow: "hidden",
        display: "flex",
        position: "relative",
      }}>

        {/* Complete toggle */}
        <div
          onClick={() => toggle.mutate()}
          style={{
            ...tapStyle,
            width: 64,
            minHeight: 64,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: task.completed ? "hsl(var(--primary))" : "transparent",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: `2.5px solid ${task.completed ? "hsl(var(--primary-foreground))" : isOverdue ? "#fb923c" : "hsl(var(--muted-foreground) / 0.4)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: task.completed ? "hsl(var(--primary-foreground))" : "transparent",
          }}>
            {task.completed && <Check size={17} color="hsl(var(--primary))" strokeWidth={3} />}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 4px 12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{
              fontSize: 14, fontWeight: 500, lineHeight: 1.35, margin: 0,
              color: task.completed ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
              textDecoration: task.completed ? "line-through" : "none",
            }}>
              {task.title}
            </p>
            {isNewTask && !task.completed && (
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f97316", flexShrink: 0 }} />
            )}
          </div>
          {task.due_date && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Calendar size={11} color={isOverdue ? "#fb923c" : "hsl(var(--muted-foreground))"} />
              <span style={{ fontSize: 11, color: isOverdue ? "#fb923c" : "hsl(var(--muted-foreground))", fontWeight: isOverdue ? 600 : 400 }}>
                {task.due_date}{isOverdue ? " · Overdue" : ""}
              </span>
            </div>
          )}
          {task.assigned_to && (
            <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "2px 0 0" }}>{task.assigned_to}</p>
          )}
        </div>

        {/* Right controls — completely isolated from Radix */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 10px 10px 4px", flexShrink: 0 }}>

          {/* Priority — plain div, no Radix anywhere near it */}
          <div
            onClick={(e) => { e.stopPropagation(); cyclePriority.mutate(); }}
            style={{
              ...tapStyle,
              backgroundColor: pCfg.bg,
              color: pCfg.text,
              fontSize: 10, fontWeight: 700,
              borderRadius: 6,
              minWidth: 44, minHeight: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 8px",
            }}
          >
            {cyclePriority.isPending ? "..." : pCfg.label}
          </div>

          {/* Edit / Expand / Delete row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {onEdit && (
              <div
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{ ...tapStyle, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Pencil size={13} color="hsl(var(--muted-foreground))" />
              </div>
            )}
            {onExpand && (
              <div
                onClick={(e) => { e.stopPropagation(); onExpand(); }}
                style={{ ...tapStyle, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <ChevronDown size={13} color="hsl(var(--muted-foreground))" />
              </div>
            )}
            <div
              onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
              style={{ ...tapStyle, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Trash2 size={13} color="hsl(var(--muted-foreground))" />
            </div>
          </div>
        </div>
      </div>

      {/* Delete dialog — completely outside the task card */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
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
    </>
  );
}