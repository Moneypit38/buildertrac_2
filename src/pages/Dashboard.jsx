import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useClientAccess } from "../hooks/useClientAccess";
import StatCards from "../components/StatCards";
import ProjectCard from "../components/ProjectCard";
import { HardHat, Layers } from "lucide-react";
import PortfolioIcon, { getColor } from "../components/PortfolioIcon";
import { Link } from "react-router-dom";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

const HERO_IMG = "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/c979cb0cc_IMG_2880.png";

export default function Dashboard() {
  const { allowedProjectIds, isLoading: accessLoading } = useClientAccess();
  const qc = useQueryClient();
  const { refreshing, touchHandlers } = usePullToRefresh(() => qc.invalidateQueries());
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list() });
  const { data: photos = [] } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });

  const visibleProjects = allowedProjectIds ? projects.filter(p => allowedProjectIds.includes(p.id)) : projects;
  const visibleTasks = allowedProjectIds ? tasks.filter(t => allowedProjectIds.includes(t.project_id)) : tasks;
  const visibleDocs = allowedProjectIds ? docs.filter(d => allowedProjectIds.includes(d.project_id)) : docs;
  const visiblePhotos = allowedProjectIds ? photos.filter(ph => allowedProjectIds.includes(ph.project_id)) : photos;

  const activeTasks = visibleTasks.filter(t => !t.completed).length;

  // Only show portfolios that have at least one visible project
  const visiblePortfolios = portfolios.filter(pf =>
    visibleProjects.some(p => p.portfolio === pf.name)
  );

  if (accessLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6" {...touchHandlers}>
      {refreshing && (
        <div className="flex justify-center pt-2"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      )}
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-40">
        <img src={HERO_IMG} alt="Construction" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-extrabold font-display text-white flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary" /> Your Site Overview
          </h1>
          <p className="text-sm text-white/70 mt-0.5">Everything at a glance</p>
        </div>
      </div>

      <StatCards stats={[
        { value: activeTasks, label: "Active Tasks", href: "/projects" },
        { value: visibleDocs.length, label: "Documents", href: "/documents" },
        { value: visiblePhotos.length, label: "Site Photos", href: "/photos" },
        { value: visibleProjects.length, label: "Projects", href: "/projects" },
      ]} />

      {/* Portfolios */}
      {visiblePortfolios.length > 0 && (
        <div>
          <h2 className="text-primary font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Portfolios
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {visiblePortfolios.map(pf => {
              const pfProjects = visibleProjects.filter(p => p.portfolio === pf.name);
              const colorDef = getColor(pf.color);
              return (
                <Link
                  key={pf.id}
                  to="/portfolios"
                  className={`flex flex-col gap-2 p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-all`}
                >
                  <PortfolioIcon icon={pf.icon} color={pf.color} size="sm" />
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${colorDef.text}`}>{pf.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{pfProjects.length} project{pfProjects.length !== 1 ? "s" : ""}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      <div>
        <h2 className="text-primary font-bold text-sm uppercase tracking-wider mb-3">Your Projects</h2>
        {visibleProjects.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <HardHat className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No projects yet. Head to Projects to break ground.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}