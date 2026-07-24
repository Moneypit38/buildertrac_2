import { useState } from "react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientAccess } from "../hooks/useClientAccess";
import { base44 } from "@/api/base44Client";
import ProjectCard from "../components/ProjectCard";
import CreateProjectDialog from "../components/CreateProjectDialog";
import AssignPortfolioDialog from "../components/AssignPortfolioDialog";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Layers } from "lucide-react";


export default function Projects() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: allTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: allNotes = [] } = useQuery({ queryKey: ["notes"], queryFn: () => base44.entities.Note.list() });
  const { isClientOnly, allowedProjectIds } = useClientAccess();
  const qc = useQueryClient();
  const { refreshing, touchHandlers } = usePullToRefresh(() => qc.invalidateQueries({ queryKey: ["projects"] }));
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("All");
  const [assignProject, setAssignProject] = useState(null);
  const deleteProject = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const visibleProjects = allowedProjectIds
    ? projects.filter(p => allowedProjectIds.includes(p.id))
    : projects;

  const portfolios = ["All", ...new Set(visibleProjects.map(p => p.portfolio).filter(Boolean))];
  const filtered = filter === "All" ? visibleProjects : visibleProjects.filter(p => p.portfolio === filter);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4" {...touchHandlers}>
      {refreshing && (
        <div className="flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Projects</h1>
        {!isClientOnly && <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Project</Button>}
      </div>

      {portfolios.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {portfolios.map(p => (
            <button key={p} onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === p ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No projects here yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="space-y-1">
              <ProjectCard project={p} onDelete={!isClientOnly ? () => deleteProject.mutate(p.id) : undefined} allTasks={allTasks} allNotes={allNotes} />
              {!isClientOnly && !p.portfolio && (
                <button
                  onClick={() => setAssignProject(p)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-lg transition-colors"
                >
                  <Layers className="w-3 h-3" /> Assign to Portfolio
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateProjectDialog open={showCreate} onClose={() => setShowCreate(false)} />
      {assignProject && (
        <AssignPortfolioDialog open={!!assignProject} onClose={() => setAssignProject(null)} project={assignProject} />
      )}
    </div>
  );
}