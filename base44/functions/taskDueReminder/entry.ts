import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('AUTOMATION_SECRET');
    if (secret) {
      const authHeader = req.headers.get('x-automation-secret');
      if (authHeader !== secret) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

    const members = await base44.asServiceRole.entities.ProjectMember.list();

    let emailsSent = 0;

    for (const [projectId, tasks] of Object.entries(byProject)) {
      const project = projectMap[projectId];
      if (!project) continue;

      const projectMembers = members.filter(m => m.project_id === projectId);
      if (projectMembers.length === 0) continue;

      const taskList = tasks.map(t => {
        const daysLeft = Math.ceil((new Date(t.due_date) - today) / (1000 * 60 * 60 * 24));
        return `• ${t.title} — due ${t.due_date} (${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`})`;
      }).join('\n');

      for (const member of projectMembers) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: member.user_email,
          subject: `⏰ Upcoming task deadlines — ${project.name}`,
          body: `Hi ${member.user_name || member.user_email},\n\nThe following tasks on "${project.name}" are due soon:\n\n${taskList}\n\nPlease log in to BuilderTrac to review and update task statuses.\n\nThank you,\nBuilderTrac`,
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});