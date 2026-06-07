import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "../components/ResponsiveSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Trash2, Users, Shield, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const ROLES = [
  { value: "admin", label: "Admin", description: "Manage portfolio, all projects & team", icon: Shield, style: "bg-primary/15 text-primary border-primary/30" },
  { value: "member", label: "Member", description: "View & edit all projects in portfolio", icon: Pencil, style: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "viewer", label: "Viewer", description: "Read-only access to all projects", icon: Eye, style: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
];
const roleInfo = Object.fromEntries(ROLES.map(r => [r.value, r]));
const blank = { user_name: "", user_email: "", role: "member" };

export default function PortfolioMembersDialog({ open, onClose, portfolio }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [inviting, setInviting] = useState(false);
  const [mode, setMode] = useState("contact");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [bulkRole, setBulkRole] = useState("member");

  const { data: members = [] } = useQuery({
    queryKey: ["portfolio-members", portfolio?.id],
    queryFn: () => base44.entities.PortfolioMember.filter({ portfolio_id: portfolio.id }),
    enabled: !!portfolio?.id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list(),
  });

  const addMember = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PortfolioMember.create({ ...data, portfolio_id: portfolio.id });
      await base44.users.inviteUser(data.user_email, data.role === "admin" ? "admin" : "user");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-members", portfolio.id] });
      toast.success("Member invited successfully!");
      setForm(blank);
      setSelectedContactIds([]);
      setInviting(false);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.PortfolioMember.update(id, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio-members", portfolio.id] }); toast.success("Role updated"); },
  });

  const removeMember = useMutation({
    mutationFn: (id) => base44.entities.PortfolioMember.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio-members", portfolio.id] }); toast.success("Member removed"); },
  });

  const toggleContact = (id) => {
    setSelectedContactIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (mode === "contact") {
      if (selectedContactIds.length === 0) return toast.error("Select at least one contact");
      for (const cid of selectedContactIds) {
        const c = contacts.find(x => x.id === cid);
        if (c) await addMember.mutateAsync({ user_name: c.name, user_email: c.email, role: bulkRole });
      }
    } else {
      if (!form.user_email.trim()) return toast.error("Email is required");
      addMember.mutate(form);
    }
  };

  const addedEmails = new Set(members.map(m => m.user_email));
  const availableContacts = contacts.filter(c => !addedEmails.has(c.email));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Users className="w-4 h-4" /> Team — {portfolio?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Role legend */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          {ROLES.map(r => (
            <div key={r.value} className={`rounded-lg border px-3 py-2 text-center ${r.style}`}>
              <r.icon className="w-3.5 h-3.5 mx-auto mb-1" />
              <p className="text-[11px] font-bold">{r.label}</p>
              <p className="text-[10px] opacity-75 leading-tight">{r.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => { setInviting(v => !v); setForm(blank); setSelectedContactIds([]); }}>
              <UserPlus className="w-4 h-4 mr-1" /> Add Member
            </Button>
          </div>

          {inviting && (
            <form onSubmit={handleInvite} className="bg-accent/50 border border-border rounded-xl p-4 space-y-3">
              {/* Mode toggle */}
              <div className="flex gap-1 bg-accent rounded-lg p-0.5 w-fit">
                <button type="button"
                  onClick={() => { setMode("contact"); setForm(blank); setSelectedContactIds([]); }}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${mode === "contact" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  From Contacts
                </button>
                <button type="button"
                  onClick={() => { setMode("manual"); setForm(blank); setSelectedContactIds([]); }}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  Enter Manually
                </button>
              </div>

              {mode === "contact" ? (
                <div className="space-y-3">
                  {availableContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {contacts.length === 0 ? "No contacts yet. Add contacts from a project's Team tab." : "All your contacts are already in this portfolio."}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {availableContacts.map(c => {
                          const checked = selectedContactIds.includes(c.id);
                          return (
                            <button key={c.id} type="button" onClick={() => toggleContact(c.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors
                                ${checked ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"}`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                                {checked && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                              </div>
                              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {c.name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{c.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{c.email}{c.company ? ` · ${c.company}` : ""}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {selectedContactIds.length > 0 && (
                        <div>
                          <Label>Access level for selected ({selectedContactIds.length})</Label>
                          <ResponsiveSelect
                            value={bulkRole}
                            onValueChange={setBulkRole}
                            options={[
                              { value: "admin", label: "Admin — manage portfolio & team" },
                              { value: "member", label: "Member — view & edit all projects" },
                              { value: "viewer", label: "Viewer — read-only access" },
                            ]}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} placeholder="Jane Smith" className="h-8 text-sm" /></div>
                    <div><Label className="text-xs">Email *</Label><Input type="email" value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))} placeholder="jane@example.com" className="h-8 text-sm" /></div>
                  </div>
                  <div>
                    <Label className="text-xs">Access Level</Label>
                    <ResponsiveSelect
                      value={form.role}
                      onValueChange={v => setForm(f => ({ ...f, role: v }))}
                      options={[
                        { value: "admin", label: "Admin — manage portfolio & team" },
                        { value: "member", label: "Member — view & edit all projects" },
                        { value: "viewer", label: "Viewer — read-only access" },
                      ]}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={addMember.isPending || (mode === "contact" && selectedContactIds.length === 0)}>
                  {addMember.isPending ? "Inviting..." : "Send Invite"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setInviting(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>

        {/* Members list */}
        {members.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Users className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map(m => {
              const info = roleInfo[m.role] || roleInfo.member;
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
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
                      { value: "member", label: "Member" },
                      { value: "viewer", label: "Viewer" },
                    ]}
                    className={`h-8 text-xs w-24 border ${info.style}`}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Remove member?</AlertDialogTitle><AlertDialogDescription>Remove {m.user_name || m.user_email} from this portfolio?</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMember.mutate(m.id)} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}