import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
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

    const projects = await base44.asServiceRole.entities.Project.list();
    const project = projects.find(p => p.id === projectId);
    if (!project) return Response.json({ message: 'Project not found.' });

    const members = await base44.asServiceRole.entities.ProjectMember.list();
    const projectMembers = members.filter(m => m.project_id === projectId);

    if (projectMembers.length === 0) {
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

    for (const member of projectMembers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: member.user_email,
        subject: `${emoji} Task status updated — ${project.name}`,
        body: `Hi ${member.user_name || member.user_email},\n\nA task on "${project.name}" has been updated:\n\nTask: ${task.title}\nStatus: ${oldStatus} → ${newStatus}${task.assigned_to ? `\nAssigned to: ${task.assigned_to}` : ''}\n\nLog in to BuilderTrac to view details.\n\nThank you,\nBuilderTrac`,
      });
      emailsSent++;
    }

    return Response.json({ message: `Sent ${emailsSent} notification(s).`, emailsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});