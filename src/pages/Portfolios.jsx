import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Layers, FolderKanban, Trash2 } from "lucide-react";
import { useClientAccess } from "../hooks/useClientAccess";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

function CreatePortfolioDialog({ open, onClose }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Portfolio.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portfolio created!"); onClose(); setForm({ name: "", description: "" }); },
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-primary">New Portfolio</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); if (!form.name.trim()) return toast.error("Name required"); mutation.mutate(form); }} className="space-y-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="West Coast Residential" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..." /></div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create Portfolio"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Portfolios() {
  const { data: portfolios = [], isLoading } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { isClientOnly, allowedProjectIds } = useClientAccess();
  const [showCreate, setShowCreate] = useState(false);

  const visibleProjects = allowedProjectIds
    ? projects.filter(p => allowedProjectIds.includes(p.id))
    : projects;
  const qc = useQueryClient();

  const deletePortfolio = useMutation({
    mutationFn: (id) => base44.entities.Portfolio.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portfolio deleted"); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const projectsByPortfolio = (portfolioName) => visibleProjects.filter(p => p.portfolio === portfolioName);
  const unassigned = visibleProjects.filter(p => !p.portfolio);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Portfolios</h1>
        {!isClientOnly && <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Portfolio</Button>}
      </div>

      {portfolios.length === 0 && unassigned.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No portfolios yet. Group your projects into portfolios.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map(pf => {
            const pfProjects = projectsByPortfolio(pf.name);
            return (
              <div key={pf.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-foreground">{pf.name}</h2>
                    {pf.description && <p className="text-xs text-muted-foreground mt-0.5">{pf.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">{pfProjects.length} project{pfProjects.length !== 1 ? "s" : ""}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete portfolio?</AlertDialogTitle><AlertDialogDescription>This only deletes the portfolio label, not the projects inside it.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePortfolio.mutate(pf.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {pfProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground pl-1">No projects in this portfolio yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {pfProjects.map(p => (
                      <Link key={p.id} to={`/project/${p.id}`} className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary/40 transition-colors text-sm">
                        <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium">{p.name}</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === "In Progress" ? "bg-blue-500/15 text-blue-400" : p.status === "Completed" ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-4">
              <h2 className="font-semibold text-muted-foreground text-sm mb-3">Unassigned Projects</h2>
              <div className="space-y-1.5">
                {unassigned.map(p => (
                  <Link key={p.id} to={`/project/${p.id}`} className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary/40 transition-colors text-sm">
                    <FolderKanban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{p.name}</span>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === "In Progress" ? "bg-blue-500/15 text-blue-400" : p.status === "Completed" ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreatePortfolioDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}