import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "@/components/ResponsiveSelect";

export default function CreateProjectDialog({ open, onClose, project, defaultPortfolio }) {
  const isEdit = !!project;
  const [form, setForm] = useState(project ? {
    name: project.name || "", address: project.address || "", portfolio: project.portfolio || "",
    status: project.status || "Planning", budget_total: project.budget_total || 0, budget_spent: project.budget_spent || 0,
  } : { name: "", address: "", portfolio: defaultPortfolio || "", status: "Planning", budget_total: 0, budget_spent: 0 });

  const qc = useQueryClient();
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Project.update(project.id, data) : base44.entities.Project.create(data),
    onMutate: async (data) => {
      if (isEdit) return;
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData(["projects"]);
      qc.setQueryData(["projects"], (old = []) => [...old, { ...data, id: `temp-${Date.now()}`, created_date: new Date().toISOString() }]);
      return { prev };
    },
    onError: (_, __, ctx) => { if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["projects"] }); },
    onSuccess: () => { toast.success(isEdit ? "Project updated" : "Project created!"); onClose(); },
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
            <div><Label>Portfolio</Label>
              <ResponsiveSelect
                value={form.portfolio || "__none__"}
                onValueChange={v => setForm(f => ({ ...f, portfolio: v === "__none__" ? "" : v }))}
                placeholder="None"
                options={[{ value: "__none__", label: "None" }, ...portfolios.map(p => ({ value: p.name, label: p.name }))]}
              />
            </div>
            <div><Label>Status</Label>
              <ResponsiveSelect
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v }))}
                placeholder="Status"
                options={["Planning", "In Progress", "On Hold", "Completed"].map(s => ({ value: s, label: s }))}
              />
            </div>
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