import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useClientAccess } from "../hooks/useClientAccess";
import StatCards from "../components/StatCards";
import ProjectCard from "../components/ProjectCard";
import { HardHat, Layers } from "lucide-react";
import PortfolioIcon, { getColor } from "../components/PortfolioIcon";
import { Link } from "react-router-dom";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { isNew } from "../hooks/useLastViewed";



export default function Dashboard() {
  const { allowedProjectIds, isLoading: accessLoading } = useClientAccess();
  const qc = useQueryClient();
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener("msgs-seen-updated", handler);
    window.addEventListener("tasks-seen-updated", handler);
    return () => {
      window.removeEventListener("msgs-seen-updated", handler);
      window.removeEventListener("tasks-seen-updated", handler);
    };
  }, []);
  const { refreshing, touchHandlers } = usePullToRefresh(() => qc.invalidateQueries());
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list(), staleTime: 0 });
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list() });
  const { data: photos = [] } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });
  const { data: notes = [] } = useQuery({ queryKey: ["notes"], queryFn: () => base44.entities.Note.list() });

  const visibleProjects = allowedProjectIds ? projects.filter(p => allowedProjectIds.includes(p.id)) : projects;
  const visibleTasks = allowedProjectIds ? tasks.filter(t => allowedProjectIds.includes(t.project_id)) : tasks;
  const visibleDocs = allowedProjectIds ? docs.filter(d => allowedProjectIds.includes(d.project_id)) : docs;
  const visiblePhotos = allowedProjectIds ? photos.filter(ph => allowedProjectIds.includes(ph.project_id)) : photos;

  const todayStr = new Date().toISOString().split("T")[0];

  // Tasks overdue — only count ones not yet seen per-project
  const urgentTasks = visibleProjects.reduce((count, p) => {
    const stored = localStorage.getItem(`seenOverdueTasks_${p.id}`);
    const seenIds = stored ? new Set(JSON.parse(stored)) : null;
    const projectOverdue = visibleTasks.filter(t =>
      t.project_id === p.id && !t.completed && t.due_date && t.due_date <= todayStr
    );
    if (seenIds === null) return count + projectOverdue.length; // never visited, all count
    return count + projectOverdue.filter(t => !seenIds.has(t.id)).length;
  }, 0);

  // Docs uploaded in last 72h and not yet viewed
  const newDocs = visibleDocs.filter(d => isNew(d.created_date, "docs")).length;

  // Photos uploaded in last 72h and not yet viewed
  const newPhotos = visiblePhotos.filter(ph => isNew(ph.created_date, "photos")).length;

  // New messages = projects where notes count exceeds last-seen count
  const newNotes = visibleProjects.reduce((count, p) => {
    const stored = localStorage.getItem(`seenMsgsCount_${p.id}`);
    if (stored === null) return count; // never visited — no alert
    const projectNoteCount = notes.filter(n => n.project_id === p.id).length;
    return count + (projectNoteCount > parseInt(stored, 10) ? 1 : 0);
  }, 0);

  // Clients only see portfolios with accessible projects; admins see all portfolios
  const visiblePortfolios = allowedProjectIds
    ? portfolios.filter(pf => visibleProjects.some(p => p.portfolio === pf.name))
    : portfolios;

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
      <div className="flex items-center gap-4 pt-2">
        <img src="https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/c979cb0cc_IMG_2880.png" alt="BuilderTrac Logo" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        <div>
          <h1 className="text-2xl font-extrabold font-display flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary" /> Your Site Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Everything at a glance</p>
        </div>
      </div>

      <StatCards stats={[
        { value: urgentTasks, label: "Tasks Due / Overdue", href: "/projects" },
        { value: newNotes, label: "New Messages", href: "/projects" },
        { value: newDocs, label: "New Documents", href: "/documents" },
        { value: newPhotos, label: "New Photos", href: "/photos" },
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
            {visibleProjects.map(p => <ProjectCard key={p.id} project={p} allTasks={tasks} allNotes={notes} />)}
          </div>
        )}
      </div>
    </div>
  );
}