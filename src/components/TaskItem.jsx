import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, ChevronDown, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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

// Tiny particles for the pop burst
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: (i / 8) * 360,
  distance: 28 + Math.random() * 16,
}));

export default function TaskItem({ task, onExpand, expanded, onEdit }) {
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [burst, setBurst] = useState(false);

  const isNewTask = isNew(task.created_date, "tasks");
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completed && task.due_date && task.due_date <= todayStr;
  const currentPriority = task.priority || "medium";
  const pCfg = priorityConfig[currentPriority] || priorityConfig.medium;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"], exact: false });

  const toggle = useMutation({
    mutationFn: () => base44.entities.Task.update(task.id, { completed: !task.completed }),
    onSuccess: () => {
      invalidate();
      if (!task.completed) {
        setBurst(true);
        setTimeout(() => setBurst(false), 700);
        toast.success("Task completed! ✅");
      } else {
        toast.success("Task reopened");
      }
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
            position: "relative",
          }}
        >
          {/* Soft ripple on completion */}
          <AnimatePresence>
            {burst && (
              <motion.span
                key="ripple"
                initial={{ opacity: 0.5, scale: 0.6 }}
                animate={{ opacity: 0, scale: 2.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  position: "absolute", width: 40, height: 40, borderRadius: "50%",
                  border: "2px solid #f59e0b", pointerEvents: "none",
                }}
              />
            )}
            {burst && PARTICLES.map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.distance;
              const ty = Math.sin(rad) * p.distance;
              return (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                  animate={{ opacity: 0, x: tx, y: ty, scale: 0.3, rotate: 90 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    position: "absolute", width: 6, height: 6, borderRadius: "50%",
                    backgroundColor: p.id % 2 === 0 ? "#fbbf24" : "#f59e0b",
                    boxShadow: "0 0 6px rgba(251, 191, 36, 0.6)",
                    pointerEvents: "none",
                  }}
                />
              );
            })}
          </AnimatePresence>

          <motion.div
            animate={burst ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={burst ? { duration: 0.35 } : { type: "spring", stiffness: 400, damping: 22 }}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              border: `2px solid ${task.completed ? "transparent" : isOverdue ? "#fb923c" : "hsl(var(--muted-foreground) / 0.35)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: task.completed
                ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                : "transparent",
              boxShadow: task.completed ? "0 2px 8px rgba(245, 158, 11, 0.35)" : "none",
            }}
          >
            {task.completed && (
              <motion.svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <motion.path
                  d="M3.5 8.5L6.5 11.5L12.5 4.5"
                  stroke="#fff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </motion.svg>
            )}
          </motion.div>
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