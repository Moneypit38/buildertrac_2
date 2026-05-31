import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StatCards from "../components/StatCards";
import ProjectCard from "../components/ProjectCard";
import { HardHat } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/c09df7200_generated_image.png";

export default function Dashboard() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list() });
  const { data: photos = [] } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });

  const activeTasks = tasks.filter(t => !t.completed).length;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
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
        { value: docs.length, label: "Documents", href: "/documents" },
        { value: photos.length, label: "Site Photos", href: "/photos" },
        { value: projects.length, label: "Projects", href: "/projects" },
      ]} />

      <div>
        <h2 className="text-primary font-bold text-sm uppercase tracking-wider mb-3">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <HardHat className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No projects yet. Head to Projects to break ground.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}