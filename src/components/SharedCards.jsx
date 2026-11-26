import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { toast } from "sonner";
import PortfolioIcon, { getColor } from "./PortfolioIcon";
import ProjectCard from "./ProjectCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusBadgeStyle = (status) => {
  if (status === "In Progress") return "bg-blue-500/20 text-blue-400";
  if (status === "Completed") return "bg-green-500/20 text-green-400";
  if (status === "On Hold") return "bg-orange-500/20 text-orange-400";
  if (status === "Planning") return "bg-purple-500/20 text-purple-400";
  return "bg-muted text-muted-foreground";
};

// Shared portfolios, drawn exactly like the user's own portfolio cards.
export function SharedPortfolioCards({ shared }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const unlink = async (job) => {
    await base44.entities.SharedJob.delete(job.id);
    qc.invalidateQueries({ queryKey: ["sharedJobs"] });
    toast.success("Removed from your app");
  };

  return shared
    .filter((s) => s.data.portfolio_name)
    .map(({ job, data }) => {
      const pfProjects = data.projects || [];
      const style = data.portfolio_style || {};
      const colorDef = getColor(style.color);
      const done = pfProjects.filter((p) => p.status === "Completed").length;
      const completion = pfProjects.length ? Math.round((done / pfProjects.length) * 100) : 0;
      const counts = {};
      pfProjects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
      const statuses = Object.entries(counts);
      const pfPhotos = pfProjects.flatMap((p) => p.photos || []).filter((ph) => ph.photo_url);
      return (
        <div key={job.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/40">
          <button className="w-full text-left p-3 space-y-2" onClick={() => navigate(`/shared/${job.token}`)}>
            <div className="flex items-start justify-between">
              <PortfolioIcon icon={style.icon} color={style.color} size="sm" logoUrl={style.logo_url} />
              <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-accent transition-colors" aria-label="Remove from my app">
                      <X className="w-3 h-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from your app?</AlertDialogTitle>
                      <AlertDialogDescription>This only removes it from your list. Nothing is deleted, and you can add it again with the invite link.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => unlink(job)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{data.portfolio_name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{pfProjects.length} Project{pfProjects.length !== 1 ? "s" : ""}</p>
            </div>
            {statuses.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {statuses.slice(0, 2).map(([status]) => (
                  <span key={status} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadgeStyle(status)}`}>{status}</span>
                ))}
              </div>
            )}
            <div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${colorDef.solid}`} style={{ width: `${completion}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{completion}% Complete</p>
            </div>
            {pfPhotos.length > 0 && (
              <div className="flex gap-1 pt-1">
                {pfPhotos.slice(0, 3).map((ph, i) => (
                  <img key={i} src={ph.photo_url} alt="" className="w-full flex-1 h-10 object-cover rounded" style={{ maxWidth: `calc(100% / ${Math.min(pfPhotos.length, 3)})` }} />
                ))}
              </div>
            )}
          </button>
        </div>
      );
    });
}

// Shared projects, drawn with the same card as the user's own projects.
export function SharedProjectCards({ shared }) {
  return shared.flatMap(({ job, data }) =>
    (data.projects || []).map((p) => (
      <ProjectCard
        key={`${job.id}-${p.id}`}
        project={p}
        to={`/shared/${job.token}?project=${p.id}`}
        allTasks={(p.tasks || []).map((t) => ({ ...t, project_id: p.id }))}
        allNotes={[]}
        allPhotos={(p.photos || []).map((ph) => ({ ...ph, project_id: p.id }))}
      />
    ))
  );
}
