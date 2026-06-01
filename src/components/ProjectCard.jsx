import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusColors = {
  "Planning": "bg-blue-500/20 text-blue-400",
  "In Progress": "bg-primary/20 text-primary",
  "On Hold": "bg-yellow-500/20 text-yellow-400",
  "Completed": "bg-green-500/20 text-green-400",
};

export default function ProjectCard({ project, onDelete }) {
  return (
    <Link to={`/project/${project.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground truncate">{project.name}</h3>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[project.status] || ""}`}>
              {project.status || "Planning"}
            </Badge>
          </div>
          {project.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0" /> {project.address}
            </p>
          )}
          {project.portfolio && (
            <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider">{project.portfolio}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button onClick={e => e.preventDefault()} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{project.name}" and cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
        </div>
      </div>
      {project.budget_total > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Budget</span>
            <span>${(project.budget_spent || 0).toLocaleString()} / ${project.budget_total.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, ((project.budget_spent || 0) / project.budget_total) * 100)}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}