import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import TaskItem from "../components/TaskItem";
import DocumentCard from "../components/DocumentCard";
import PhotoCard from "../components/PhotoCard";
import CreateTaskDialog from "../components/CreateTaskDialog";
import UploadDocDialog from "../components/UploadDocDialog";
import UploadPhotoDialog from "../components/UploadPhotoDialog";
import CreateProjectDialog from "../components/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, MapPin, ClipboardList, FileText, Camera, Pencil, DollarSign, Users } from "lucide-react";
import ProjectMembersTab from "../components/ProjectMembersTab";
import SubtaskList from "../components/SubtaskList";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { data: project, isLoading } = useQuery({ queryKey: ["project", projectId], queryFn: () => base44.entities.Project.get(projectId) });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", projectId], queryFn: () => base44.entities.Task.filter({ project_id: projectId }) });
  const { data: docs = [] } = useQuery({ queryKey: ["documents", projectId], queryFn: () => base44.entities.Document.filter({ project_id: projectId }) });
  const { data: photos = [] } = useQuery({ queryKey: ["photos", projectId], queryFn: () => base44.entities.SitePhoto.filter({ project_id: projectId }) });
  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: myMembership = [] } = useQuery({ queryKey: ["membership", projectId], queryFn: () => base44.entities.ProjectMember.filter({ project_id: projectId }), enabled: !!currentUser });
  const myRole = myMembership.find(m => m.user_email === currentUser?.email)?.role;
  const isClient = myRole === "client";

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const toggleExpand = (id) => setExpandedTasks(p => ({ ...p, [id]: !p[id] }));

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="p-4 text-center text-muted-foreground">Project not found</div>;

  const rootTasks = tasks.filter(t => !t.parent_task_id);
  const tasksBySection = { today: rootTasks.filter(t => t.section === "today"), upcoming: rootTasks.filter(t => t.section === "upcoming"), later: rootTasks.filter(t => t.section === "later") };
  const budgetPct = project.budget_total > 0 ? Math.min(100, ((project.budget_spent || 0) / project.budget_total) * 100) : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">{project.name}</h1>
            {project.address && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {project.address}</p>}
            {project.portfolio && <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{project.portfolio}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowEditProject(true)}><Pencil className="w-4 h-4" /></Button>
        </div>
        {project.budget_total > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm mb-1.5">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-semibold">${(project.budget_spent || 0).toLocaleString()}</span>
              <span className="text-muted-foreground">/ ${project.budget_total.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="w-full bg-card border border-border">
          {!isClient && <TabsTrigger value="tasks" className="flex-1 gap-1"><ClipboardList className="w-4 h-4" /> Tasks ({rootTasks.length})</TabsTrigger>}
          <TabsTrigger value="docs" className="flex-1 gap-1"><FileText className="w-4 h-4" /> Docs ({docs.length})</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 gap-1"><Camera className="w-4 h-4" /> Photos ({photos.length})</TabsTrigger>
          {!isClient && <TabsTrigger value="team" className="flex-1 gap-1"><Users className="w-4 h-4" /> Team</TabsTrigger>}
        </TabsList>

        {!isClient && (
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Button size="sm" onClick={() => { setEditTask(null); setShowTaskDialog(true); }}><Plus className="w-4 h-4 mr-1" /> Add Task</Button>
          {["today", "upcoming", "later"].map(section => (
            <div key={section}>
              <h3 className="text-primary font-bold text-xs uppercase tracking-wider mb-2">
                {section === "today" ? "📋 Today" : section === "upcoming" ? "📅 Upcoming" : "⏰ Later"}
              </h3>
              {tasksBySection[section].length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2 mb-3">No tasks</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {tasksBySection[section].map(t => (
                    <div key={t.id}>
                      <TaskItem task={t} onExpand={() => toggleExpand(t.id)} expanded={!!expandedTasks[t.id]} onEdit={() => { setEditTask(t); setShowTaskDialog(true); }} />
                      {expandedTasks[t.id] && <SubtaskList parentTaskId={t.id} projectId={projectId} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </TabsContent>
        )}

        <TabsContent value="docs" className="space-y-3 mt-4">
          <Button size="sm" onClick={() => { setEditDoc(null); setShowDocDialog(true); }}><Plus className="w-4 h-4 mr-1" /> Upload Document</Button>
          {docs.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center"><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No documents yet. Upload your first blueprint.</p></div>
          ) : (
            <div className="space-y-2">{docs.map(d => <DocumentCard key={d.id} doc={d} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-3 mt-4">
          <Button size="sm" onClick={() => { setEditPhoto(null); setShowPhotoDialog(true); }}><Plus className="w-4 h-4 mr-1" /> Add Photo</Button>
          {photos.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center"><Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No site photos yet. Capture the progress.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{photos.map(p => <PhotoCard key={p.id} photo={p} />)}</div>
          )}
        </TabsContent>

        {!isClient && (
        <TabsContent value="team" className="mt-4">
          <ProjectMembersTab projectId={projectId} />
        </TabsContent>
        )}
      </Tabs>

      {showTaskDialog && <CreateTaskDialog open={showTaskDialog} onClose={() => setShowTaskDialog(false)} projectId={projectId} task={editTask} />}
      {showDocDialog && <UploadDocDialog open={showDocDialog} onClose={() => setShowDocDialog(false)} projectId={projectId} doc={editDoc} />}
      {showPhotoDialog && <UploadPhotoDialog open={showPhotoDialog} onClose={() => setShowPhotoDialog(false)} projectId={projectId} photo={editPhoto} />}
      {showEditProject && <CreateProjectDialog open={showEditProject} onClose={() => setShowEditProject(false)} project={project} />}
    </div>
  );
}