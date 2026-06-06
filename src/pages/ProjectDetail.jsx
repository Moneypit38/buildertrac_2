import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, Plus, MapPin, ClipboardList, FileText, Camera, Pencil, DollarSign, Users, MessageSquare, Trash2, CalendarClock } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ProjectMembersTab from "../components/ProjectMembersTab";
import NotesTab from "../components/NotesTab";
import SubtaskList from "../components/SubtaskList";
import AITaskGenerator from "../components/AITaskGenerator";
import AppointmentsTab from "../components/AppointmentsTab";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { data: project, isLoading } = useQuery({ queryKey: ["project", projectId], queryFn: () => base44.entities.Project.get(projectId) });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", projectId], queryFn: () => base44.entities.Task.filter({ project_id: projectId }) });
  const { data: docs = [] } = useQuery({ queryKey: ["documents", projectId], queryFn: () => base44.entities.Document.filter({ project_id: projectId }) });
  const { data: photos = [] } = useQuery({ queryKey: ["photos", projectId], queryFn: () => base44.entities.SitePhoto.filter({ project_id: projectId }) });
  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: myMembership = [] } = useQuery({ queryKey: ["membership", projectId], queryFn: () => base44.entities.ProjectMember.filter({ project_id: projectId }), enabled: !!currentUser });
  const myRole = myMembership.find(m => m.user_email === currentUser?.email)?.role;
  const isAdmin = myRole === "admin" || currentUser?.role === "admin";
  const isTeamMember = myRole === "team_member";
  const isClient = myRole === "client";
  const canDelete = !isClient; // clients can upload/download but not delete

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => base44.entities.Note.filter({ project_id: projectId }),
  });

  const msgsCountKey = `seenMsgsCount_${projectId}`;
  const seenCount = parseInt(localStorage.getItem(msgsCountKey) || "0", 10);
  const msgsBadge = notes.length > seenCount;

  const markMsgsViewed = () => {
    localStorage.setItem(msgsCountKey, String(notes.length));
    window.dispatchEvent(new Event("msgs-seen-updated"));
  };

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const navigate = useNavigate();
  const qc = useQueryClient();
  const deleteProject = useMutation({
    mutationFn: () => base44.entities.Project.delete(projectId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); navigate("/"); },
  });


  const toggleExpand = (id) => setExpandedTasks(p => ({ ...p, [id]: !p[id] }));

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="p-4 text-center text-muted-foreground">Project not found</div>;

  const rootTasks = tasks.filter(t => !t.parent_task_id);
  const budgetPct = project.budget_total > 0 ? Math.min(100, ((project.budget_spent || 0) / project.budget_total) * 100) : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">


      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">{project.name}</h1>
            {project.address && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {project.address}</p>}
            {project.portfolio && <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{project.portfolio}</p>}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowEditProject(true)}><Pencil className="w-4 h-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete project?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete "{project.name}" and cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteProject.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        {project.budget_total > 0 && !isClient && (
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
      <Tabs defaultValue={isClient ? "docs" : "tasks"}>
        <TabsList className="w-full bg-card border border-border p-0.5 flex">
          {!isClient && <TabsTrigger value="tasks" className="flex-1 gap-1 text-xs px-1 py-1"><ClipboardList className="w-3 h-3" /><span>Tasks</span></TabsTrigger>}
          <TabsTrigger value="docs" className="flex-1 gap-1 text-xs px-1 py-1"><FileText className="w-3 h-3" /><span>Docs</span></TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 gap-1 text-xs px-1 py-1"><Camera className="w-3 h-3" /><span>Photos</span></TabsTrigger>
          {!isClient && <TabsTrigger value="appointments" className="flex-1 gap-1 text-xs px-1 py-1"><CalendarClock className="w-3 h-3" /><span>Appts</span></TabsTrigger>}
          {isAdmin && <TabsTrigger value="team" className="flex-1 gap-1 text-xs px-1 py-1"><Users className="w-3 h-3" /><span>Team</span></TabsTrigger>}
          <TabsTrigger value="notes" className="flex-1 gap-1 text-xs px-1 py-1 relative" onClick={markMsgsViewed}>
            <span className="relative">
              <MessageSquare className="w-3 h-3" />
              {msgsBadge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-300 ring-2 ring-background animate-pulse" />}
            </span>
            <span>Messages</span>
          </TabsTrigger>
        </TabsList>

        {!isClient && (
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setEditTask(null); setShowTaskDialog(true); }}><Plus className="w-4 h-4 mr-1" /> Add Task</Button>
          </div>
          <AITaskGenerator projectId={projectId} projectName={project?.name} />
          {rootTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tasks yet. Add your first task above.</p>
          ) : (
            <div className="space-y-2">
              {rootTasks.map(t => (
                <div key={t.id}>
                  <TaskItem task={t} onExpand={() => toggleExpand(t.id)} expanded={!!expandedTasks[t.id]} onEdit={() => { setEditTask(t); setShowTaskDialog(true); }} />
                  {expandedTasks[t.id] && <SubtaskList parentTaskId={t.id} projectId={projectId} />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        )}

        <TabsContent value="docs" className="space-y-3 mt-4">
          <Button size="sm" onClick={() => { setEditDoc(null); setShowDocDialog(true); }}><Plus className="w-4 h-4 mr-1" /> Upload Document</Button>
          {docs.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center"><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No documents yet. Upload your first blueprint.</p></div>
          ) : (
            <div className="space-y-2">{docs.map(d => <DocumentCard key={d.id} doc={d} canDelete={canDelete} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-3 mt-4">
          <Button size="sm" onClick={() => { setEditPhoto(null); setShowPhotoDialog(true); }}><Plus className="w-4 h-4 mr-1" /> Add Photo</Button>
          {photos.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center"><Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No site photos yet. Capture the progress.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{photos.map(p => <PhotoCard key={p.id} photo={p} canDelete={canDelete} />)}</div>
          )}
        </TabsContent>

        {!isClient && (
        <TabsContent value="appointments" className="mt-4">
          <AppointmentsTab projectId={projectId} canDelete={canDelete} />
        </TabsContent>
        )}

        {isAdmin && (
        <TabsContent value="team" className="mt-4">
          <ProjectMembersTab projectId={projectId} />
        </TabsContent>
        )}

        <TabsContent value="notes" className="mt-4">
          <NotesTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      {showTaskDialog && <CreateTaskDialog open={showTaskDialog} onClose={() => setShowTaskDialog(false)} projectId={projectId} task={editTask} />}
      {showDocDialog && <UploadDocDialog open={showDocDialog} onClose={() => setShowDocDialog(false)} projectId={projectId} doc={editDoc} />}
      {showPhotoDialog && <UploadPhotoDialog open={showPhotoDialog} onClose={() => setShowPhotoDialog(false)} projectId={projectId} photo={editPhoto} />}
      {showEditProject && <CreateProjectDialog open={showEditProject} onClose={() => setShowEditProject(false)} project={project} />}
    </div>
  );
}