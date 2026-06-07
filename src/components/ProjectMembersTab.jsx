import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "../components/ResponsiveSelect";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Users, BookUser } from "lucide-react";
import { toast } from "sonner";
import ManageContactsDialog from "./ManageContactsDialog";
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

const blank = { user_name: "", user_email: "", role: "team_member" };

export default function ProjectMembersTab({ projectId }) {
  const qc = useQueryClient();
  const [inviting, setInviting] = useState(false);
  const [mode, setMode] = useState("contact"); // "contact" | "manual"
  const [form, setForm] = useState(blank);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [showContacts, setShowContacts] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => base44.entities.ProjectMember.filter({ project_id: projectId }),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list(),
  });

  const addMember = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ProjectMember.create({ ...data, project_id: projectId });
      await base44.users.inviteUser(data.user_email, data.role === "admin" ? "admin" : "user");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", projectId] });
      toast.success("Member invited! They'll receive an email to join.");
      setForm(blank);
      setSelectedContactId("");
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

  const handleContactSelect = (contactId) => {
    setSelectedContactId(contactId);
    const c = contacts.find(c => c.id === contactId);
    if (c) setForm({ user_name: c.name, user_email: c.email, role: c.default_role || "team_member" });
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!form.user_email.trim()) return toast.error("Email is required");
    addMember.mutate(form);
  };

  // Already-added member emails
  const addedEmails = new Set(members.map(m => m.user_email));
  const availableContacts = contacts.filter(c => !addedEmails.has(c.email));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowContacts(true)}>
            <BookUser className="w-4 h-4 mr-1" /> Contacts
          </Button>
          <Button size="sm" onClick={() => { setInviting(!inviting); setForm(blank); setSelectedContactId(""); }}>
            <UserPlus className="w-4 h-4 mr-1" /> Invite
          </Button>
        </div>
      </div>

      {inviting && (
        <form onSubmit={handleInvite} className="bg-accent/50 border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">Add to project</p>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-accent rounded-lg p-0.5 w-fit">
            <button type="button"
              onClick={() => { setMode("contact"); setForm(blank); setSelectedContactId(""); }}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${mode === "contact" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              From Contacts
            </button>
            <button type="button"
              onClick={() => { setMode("manual"); setForm(blank); setSelectedContactId(""); }}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Enter Manually
            </button>
          </div>

          {mode === "contact" ? (
            <div className="space-y-3">
              {availableContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {contacts.length === 0
                    ? "No contacts yet. Use the Contacts button to add people first."
                    : "All your contacts are already on this project."}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {availableContacts.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleContactSelect(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors
                        ${selectedContactId === c.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}{c.company ? ` · ${c.company}` : ""}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                        {roleLabels[c.default_role] || c.default_role}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedContactId && (
                <div>
                  <Label>Role for this project</Label>
                  <ResponsiveSelect
                    value={form.role}
                    onValueChange={v => setForm(f => ({ ...f, role: v }))}
                    options={[
                      { value: "team_member", label: "Team Member — full project access" },
                      { value: "client", label: "Client — docs & photos only" },
                      { value: "admin", label: "Admin — manage everything" },
                    ]}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} placeholder="Jane Smith" /></div>
                <div><Label>Email *</Label><Input type="email" value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))} placeholder="jane@example.com" /></div>
              </div>
              <div><Label>Role</Label>
                <ResponsiveSelect
                  value={form.role}
                  onValueChange={v => setForm(f => ({ ...f, role: v }))}
                  options={[
                    { value: "team_member", label: "Team Member — full project access" },
                    { value: "client", label: "Client — docs & photos only" },
                    { value: "admin", label: "Admin — manage everything" },
                  ]}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={addMember.isPending || (mode === "contact" && !selectedContactId)}
            >
              {addMember.isPending ? "Inviting..." : "Send Invite"}
            </Button>
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
              <ResponsiveSelect
                value={m.role}
                onValueChange={role => updateRole.mutate({ id: m.id, role })}
                options={[
                  { value: "admin", label: "Admin" },
                  { value: "team_member", label: "Team Member" },
                  { value: "client", label: "Client" },
                ]}
                className={`h-8 text-xs w-28 border ${roleStyles[m.role]}`}
              />
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

      <ManageContactsDialog open={showContacts} onClose={() => setShowContacts(false)} />
    </div>
  );
}