import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, CalendarClock, Clock, MapPin, Users, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CreateAppointmentDialog from "./CreateAppointmentDialog";
import { toast } from "sonner";
import { format } from "date-fns";

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AppointmentsTab({ projectId, canDelete }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editAppt, setEditAppt] = useState(null);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", projectId],
    queryFn: () => base44.entities.Appointment.filter({ project_id: projectId }),
  });

  const deleteAppt = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", projectId] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment deleted");
    },
  });

  const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date));
  const todayStr = new Date().toISOString().split("T")[0];

  const upcoming = sorted.filter(a => a.date >= todayStr);
  const past = sorted.filter(a => a.date < todayStr);

  const AppointmentCard = ({ appt }) => {
    const isPast = appt.date < todayStr;
    return (
      <div className={`bg-card border rounded-xl p-3 ${isPast ? "opacity-60 border-border" : "border-purple-500/40"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{appt.title}</p>
              <p className="text-xs text-purple-400 font-medium mt-0.5">
                {format(new Date(appt.date + "T12:00:00"), "EEE, MMM d, yyyy")}
              </p>
              {(appt.start_time || appt.end_time) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(appt.start_time)}{appt.end_time ? ` – ${formatTime(appt.end_time)}` : ""}
                </p>
              )}
              {appt.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {appt.location}
                </p>
              )}
              {appt.attendees && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" /> {appt.attendees}
                </p>
              )}
              {appt.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{appt.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => { setEditAppt(appt); setShowDialog(true); }} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteAppt.mutate(appt.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => { setEditAppt(null); setShowDialog(true); }}>
        <Plus className="w-4 h-4 mr-1" /> Add Appointment
      </Button>

      {upcoming.length === 0 && past.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CalendarClock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No appointments yet.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
          {upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past</p>
          {past.map(a => <AppointmentCard key={a.id} appt={a} />)}
        </div>
      )}

      <CreateAppointmentDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditAppt(null); }}
        projectId={projectId}
        appointment={editAppt}
      />
    </div>
  );
}