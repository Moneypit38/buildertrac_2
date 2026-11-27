import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { notificationRecipients, plain } from '../../shared/taskNotifications.ts';

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('AUTOMATION_SECRET');
    if (!secret || req.headers.get('x-automation-secret') !== secret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    const today = new Date();
    const in2Days = new Date(today);
    in2Days.setDate(today.getDate() + 2);
    const todayStr = today.toISOString().split('T')[0];
    const in2DaysStr = in2Days.toISOString().split('T')[0];

    // Get all incomplete tasks with due dates in the next 2 days
    const tasks = await base44.asServiceRole.entities.Task.list();
    const dueSoonTasks = tasks.filter(t =>
      !t.completed &&
      t.due_date &&
      t.due_date >= todayStr &&
      t.due_date <= in2DaysStr &&
      !t.reminder_sent
    );

    if (dueSoonTasks.length === 0) {
      return Response.json({ message: 'No upcoming due tasks found.' });
    }

    // Group tasks by project
    const byProject = {};
    for (const task of dueSoonTasks) {
      if (!byProject[task.project_id]) byProject[task.project_id] = [];
      byProject[task.project_id].push(task);
    }

    const projects = await base44.asServiceRole.entities.Project.list();
    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

    let emailsSent = 0;

    for (const [projectId, tasks] of Object.entries(byProject)) {
      const project = projectMap[projectId];
      if (!project) continue;

      // Only registered app users added by the project's own account are notified.
      const recipients = await notificationRecipients(base44.asServiceRole.entities, project);
      if (recipients.length === 0) continue;

      const projectName = plain(project.name, 120) || 'a project';
      const taskList = tasks.map(t => {
        const daysLeft = Math.ceil((new Date(t.due_date) - today) / (1000 * 60 * 60 * 24));
        return `• ${plain(t.title, 200)} — due ${plain(t.due_date, 10)} (${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`})`;
      }).join('\n');

      for (const member of recipients) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: member.email,
          subject: `⏰ Upcoming task deadlines — ${projectName}`,
          body: `Hi ${member.name},\n\nThe following tasks on "${projectName}" are due soon:\n\n${taskList}\n\nPlease log in to BuilderTrac to review and update task statuses.\n\nThank you,\nBuilderTrac`,
        });
        emailsSent++;
      }

      // Mark tasks as reminder sent
      for (const task of tasks) {
        await base44.asServiceRole.entities.Task.update(task.id, { reminder_sent: true });
      }
    }

    return Response.json({ message: `Sent ${emailsSent} reminder email(s).`, emailsSent });
  } catch (error) {
    console.error('taskDueReminder error:', error);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
});