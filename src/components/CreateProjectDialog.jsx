import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateProjectDialog({ open, onClose, project }) {
  const isEdit = !!project;
  const [form, setForm] = useState(project ? {
    name: project.name || "", address: project.address || "", portfolio: project.portfolio || "",
    status: project.status || "Planning", budget_total: project.budget_total || 0, budget_spent: project.budget_spent || 0,
  } : { name: "", address: "", portfolio: "", status: "Planning", budget_total: 0, budget_spent: 0 });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Project.update(project.id, data) : base44.entities.Project.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success(isEdit ? "Project updated" : "Project created!"); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Project name is required");
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-primary">{isEdit ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Project Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Downtown Tower" /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Los Angeles, CA" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Portfolio</Label><Input value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} placeholder="West Coast Residential" /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Planning", "In Progress", "On Hold", "Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Total Budget ($)</Label><Input type="number" min={0} value={form.budget_total} onChange={e => setForm(f => ({ ...f, budget_total: Number(e.target.value) }))} /></div>
            <div><Label>Spent ($)</Label><Input type="number" min={0} value={form.budget_spent} onChange={e => setForm(f => ({ ...f, budget_spent: Number(e.target.value) }))} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}