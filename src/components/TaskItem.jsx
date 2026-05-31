import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Trash2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const priorityStyles = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

const statusStyles = {
  "Not Started": "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Pending Approval": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Blocked": "bg-red-500/15 text-red-400 border-red-500/30",
  "Done": "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function TaskItem({ task, onExpand, expanded }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => base44.entities.Task.update(task.id, { completed: !task.completed }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success(task.completed ? "Task reopened" : "Task completed!"); },
  });
  const remove = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task removed"); },
  });

  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 group hover:border-primary/30 transition-all">
      <button onClick={() => toggle.mutate()}
        className={`w-5 h-5 rounded-md border-2 shrink-0 transition-all duration-300 ${task.completed ? "bg-primary border-primary scale-110" : "border-muted-foreground/40 bg-background hover:border-primary/60"}`}>
        {task.completed && <svg className="w-full h-full text-primary-foreground" viewBox="0 0 16 16"><path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none"/></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
        {task.due_date && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" /> {task.due_date}
          </p>
        )}
      </div>
      {task.assigned_to && <span className="text-[10px] text-muted-foreground hidden sm:block">{task.assigned_to}</span>}
      {onExpand && (
        <button onClick={onExpand} className={`text-muted-foreground hover:text-primary transition-all ${expanded ? "rotate-180" : ""}`}><ChevronDown className="w-3.5 h-3.5" /></button>
      )}
      {task.status && task.status !== "Not Started" && (
        <Badge variant="outline" className={`text-[10px] shrink-0 hidden md:inline-flex ${statusStyles[task.status] || ""}`}>
          {task.status}
        </Badge>
      )}
      <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityStyles[task.priority] || priorityStyles.medium}`}>
        {(task.priority || "medium").toUpperCase()}
      </Badge>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
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
  );
}