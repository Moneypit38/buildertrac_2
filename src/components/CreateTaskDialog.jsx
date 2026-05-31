import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function CreateTaskDialog({ open, onClose, projectId, task }) {
  const isEdit = !!task;
  const [form, setForm] = useState(task ? {
    title: task.title || "", description: task.description || "", priority: task.priority || "medium",
    status: task.status || "Not Started", due_date: task.due_date || "", section: task.section || "today", assigned_to: task.assigned_to || "",
  } : { title: "", description: "", priority: "medium", status: "Not Started", due_date: "", section: "today", assigned_to: "" });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Task.update(task.id, data) : base44.entities.Task.create({ ...data, project_id: projectId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success(isEdit ? "Task updated" : "Task created!"); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Task title is required");
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-primary">{isEdit ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Pour concrete - Level 4" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details..." rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
              </Select></div>
             <div><Label>Section</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="later">Later</SelectItem></SelectContent>
              </Select></div>
          </div>
          <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
          <div><Label>Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Name" /></div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}