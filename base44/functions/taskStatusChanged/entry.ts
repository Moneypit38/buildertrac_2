import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { notificationRecipients, plain } from '../../shared/taskNotifications.ts';

Deno.serve(async (req) => {
  try {
    // Verify the request comes from the Base44 internal automation system
    const secret = Deno.env.get('AUTOMATION_SECRET');
    if (!secret) {
      return Response.json({ error: 'Server misconfiguration: AUTOMATION_SECRET not set' }, { status: 500 });
    }
    const authHeader = req.headers.get('x-automation-secret');
    if (authHeader !== secret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data: task, old_data: oldTask } = body;

    if (!task || !oldTask) {
      return Response.json({ message: 'Missing task data.' });
    }

    const newStatus = task.status;
    const oldStatus = oldTask.status;

    if (newStatus === oldStatus) {
      return Response.json({ message: 'Status unchanged, skipping.' });
    }

    const projectId = task.project_id;
    if (!projectId) return Response.json({ message: 'No project_id on task.' });

    const project = await base44.asServiceRole.entities.Project.get(projectId).catch(() => null);
    if (!project) return Response.json({ message: 'Project not found.' });

    // Only registered app users added by the project's own account are notified.
    const recipients = await notificationRecipients(base44.asServiceRole.entities, project);
    if (recipients.length === 0) {
      return Response.json({ message: 'No members to notify.' });
    }

    const statusEmoji = {
      'Not Started': '⬜',
      'In Progress': '🔵',
      'Pending Approval': '🟣',
      'Blocked': '🔴',
      'Done': '✅',
    };

    const emoji = statusEmoji[newStatus] || '📋';
    let emailsSent = 0;

    const projectName = plain(project.name, 120) || 'a project';
    const taskTitle = plain(task.title, 200);
    const assignee = plain(task.assigned_to, 120);

    for (const member of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: member.email,
        subject: `${emoji} Task status updated — ${projectName}`,
        body: `Hi ${member.name},\n\nA task on "${projectName}" has been updated:\n\nTask: ${taskTitle}\nStatus: ${plain(oldStatus, 40)} → ${plain(newStatus, 40)}${assignee ? `\nAssigned to: ${assignee}` : ''}\n\nLog in to BuilderTrac to view details.\n\nThank you,\nBuilderTrac`,
      });
      emailsSent++;
    }

    return Response.json({ message: `Sent ${emailsSent} notification(s).`, emailsSent });
  } catch (error) {
    console.error('taskStatusChanged error:', error);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
});