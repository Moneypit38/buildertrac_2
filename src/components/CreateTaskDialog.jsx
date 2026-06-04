import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { Textarea } from "@/components/ui/textarea";

export default function CreateTaskDialog({ open, onClose, projectId, task }) {
  const isEdit = !!task;
  const blankForm = { title: "", description: "", priority: "medium", status: "Not Started", due_date: "", assigned_to: "" };
  const taskForm = task ? {
    title: task.title || "", description: task.description || "", priority: task.priority || "medium",
    status: task.status || "Not Started", due_date: task.due_date || "", assigned_to: task.assigned_to || "",
  } : blankForm;
  const [form, setForm] = useState(taskForm);

  // Reset form whenever the dialog opens or the task changes
  useEffect(() => {
    if (open) setForm(taskForm);
  }, [open, task?.id]);

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

          <div>
            <Label>Priority</Label>
            <ResponsiveSelect
              value={form.priority}
              onValueChange={v => setForm(f => ({ ...f, priority: v }))}
              placeholder="Priority"
              options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]}
            />
          </div>
          <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="min-h-[44px]" /></div>
          <div><Label>Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Name" /></div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}