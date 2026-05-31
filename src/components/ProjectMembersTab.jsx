import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const roleStyles = {
  admin: "bg-primary/15 text-primary border-primary/30",
  team_member: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  client: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const roleLabels = { admin: "Admin", team_member: "Team Member", client: "Client" };

export default function ProjectMembersTab({ projectId }) {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => base44.entities.ProjectMember.filter({ project_id: projectId }),
  });

  const [form, setForm] = useState({ user_name: "", user_email: "", role: "team_member" });
  const [inviting, setInviting] = useState(false);

  const addMember = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ProjectMember.create({ ...data, project_id: projectId });
      await base44.users.inviteUser(data.user_email, data.role === "admin" ? "admin" : "user");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", projectId] });
      toast.success("Member invited! They'll receive an email to join.");
      setForm({ user_name: "", user_email: "", role: "team_member" });
      setInviting(false);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.ProjectMember.update(id, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members", projectId] }); toast.success("Role updated"); },
  });

  const removeMember = useMutation({
    mutationFn: (id) => base44.entities.ProjectMember.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members", projectId] }); toast.success("Member removed"); },
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!form.user_email.trim()) return toast.error("Email is required");
    addMember.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
        <Button size="sm" onClick={() => setInviting(!inviting)}>
          <UserPlus className="w-4 h-4 mr-1" /> Invite
        </Button>
      </div>

      {inviting && (
        <form onSubmit={handleInvite} className="bg-accent/50 border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">Invite to project</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} placeholder="Jane Smith" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))} placeholder="jane@example.com" /></div>
          </div>
          <div><Label>Role</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">Team Member — full project access</SelectItem>
                <SelectItem value="client">Client — docs &amp; photos only</SelectItem>
                <SelectItem value="admin">Admin — manage everything</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addMember.isPending}>{addMember.isPending ? "Inviting..." : "Send Invite"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setInviting(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No team members yet. Invite your crew or clients.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(m.user_name || m.user_email)?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user_name || m.user_email}</p>
                {m.user_name && <p className="text-xs text-muted-foreground truncate">{m.user_email}</p>}
              </div>
              <Select value={m.role} onValueChange={role => updateRole.mutate({ id: m.id, role })}>
                <SelectTrigger className={`h-7 text-[11px] w-28 border ${roleStyles[m.role]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Remove member?</AlertDialogTitle><AlertDialogDescription>Remove {m.user_name || m.user_email} from this project?</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeMember.mutate(m.id)} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}