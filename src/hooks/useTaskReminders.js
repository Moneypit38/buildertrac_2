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
        const projectName = projectMap[task.project_id] || "your project";
        await base44.integrations.Core.SendEmail({
          to: task.assigned_to,
          subject: `⏰ Task due soon: ${task.title}`,
          body: `Hi,\n\nThis is a reminder that the following task is due within 24 hours:\n\n📋 Task: ${task.title}\n📁 Project: ${projectName}\n📅 Due: ${task.due_date}\n${task.description ? `\nDetails: ${task.description}\n` : ""}\nPlease log in to BuildFlow to update your progress.\n\nBuildFlow Team`,
        });
        await base44.entities.Task.update(task.id, { reminder_sent: true });
      }
    }

    sendReminders();
  }, []);
}