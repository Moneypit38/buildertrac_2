import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProjectCard from "../components/ProjectCard";
import CreateProjectDialog from "../components/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

export default function Projects() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("All");

  const portfolios = ["All", ...new Set(projects.map(p => p.portfolio).filter(Boolean))];
  const filtered = filter === "All" ? projects : projects.filter(p => p.portfolio === filter);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Projects</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Project</Button>
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
        <div className="space-y-3">{filtered.map(p => <ProjectCard key={p.id} project={p} />)}</div>
      )}

      <CreateProjectDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}