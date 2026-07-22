import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function useTaskReminders() {
  useEffect(() => {
    async function sendReminders() {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) return;

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const todayStr = now.toISOString().slice(0, 10);
      const in24hStr = in24h.toISOString().slice(0, 10);

      // Get all incomplete, unreminded tasks with an assignee
      const tasks = await base44.entities.Task.filter({
        completed: false,
        reminder_sent: false,
      });

      const projects = await base44.entities.Project.list();
      const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

      const dueSoon = tasks.filter(t =>
        t.assigned_to &&
        t.assigned_to.includes("@") &&
        t.due_date >= todayStr &&
        t.due_date <= in24hStr
      );

      for (const task of dueSoon) {
        // Mark reminder sent only — email dispatch is handled server-side by the taskDueReminder scheduled function
        await base44.entities.Task.update(task.id, { reminder_sent: true });
      }
    }

    sendReminders();
  }, []);
}