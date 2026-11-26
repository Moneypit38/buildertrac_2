import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DateInput from "@/components/DateInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CreateAppointmentDialog({ open, onClose, projectId, appointment, initialDate }) {
  const qc = useQueryClient();
  const isEdit = !!appointment;

  const [form, setForm] = useState({
    title: "",
    date: initialDate || "",
    start_time: "",
    end_time: "",
    location: "",
    attendees: "",
    notes: "",
  });

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title || "",
        date: appointment.date || "",
        start_time: appointment.start_time || "",
        end_time: appointment.end_time || "",
        location: appointment.location || "",
        attendees: appointment.attendees || "",
        notes: appointment.notes || "",
      });
    } else {
      setForm({ title: "", date: initialDate || "", start_time: "", end_time: "", location: "", attendees: "", notes: "" });
    }
  }, [appointment, open, initialDate]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Appointment.update(appointment.id, data)
        : base44.entities.Appointment.create({ ...data, ...(projectId ? { project_id: projectId } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(isEdit ? "Appointment updated" : "Appointment created");
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    mutation.mutate(form);
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Appointment" : "New Appointment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 [&_label]:mb-1.5 [&_label]:block">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={set("title")} placeholder="e.g. Site inspection" className="h-11 text-sm" />
          </div>
          <div>
            <Label>Date *</Label>
            <DateInput value={form.date} onChange={set("date")} className="h-11 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <Label>Start time</Label>
              <Input type="time" value={form.start_time} onChange={set("start_time")} className="h-11 w-full min-w-0 max-w-full appearance-none text-sm" />
            </div>
            <div className="min-w-0">
              <Label>End time</Label>
              <Input type="time" value={form.end_time} onChange={set("end_time")} className="h-11 w-full min-w-0 max-w-full appearance-none text-sm" />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={set("location")} placeholder="Address or room" className="h-11 text-sm" />
          </div>
          <div>
            <Label>Attendees</Label>
            <Input value={form.attendees} onChange={set("attendees")} placeholder="Names or emails" className="h-11 text-sm" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={set("notes")} placeholder="Any additional details..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" className="h-11" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}