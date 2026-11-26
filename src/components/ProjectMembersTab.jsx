import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, Users, BookUser, Link2, Eye, Wrench } from "lucide-react";
import { toast } from "sonner";
import ManageContactsDialog from "./ManageContactsDialog";
import GuestLinkDialog from "./GuestLinkDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function ProjectMembersTab({ projectId, autoOpenInvite, onInviteOpened }) {
  const qc = useQueryClient();
  const [showShare, setShowShare] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  useEffect(() => {
    if (autoOpenInvite) {
      setShowShare(true);
      onInviteOpened?.();
    }
  }, [autoOpenInvite]);

  const { data: project } = useQuery({ queryKey: ["project", projectId], queryFn: () => base44.entities.Project.get(projectId) });

  // Guests who have a private link to this project
  const { data: links = [] } = useQuery({
    queryKey: ["share-links", "project", projectId],
    queryFn: async () => {
      const rows = await base44.entities.ShareLink.filter({ project_id: projectId });
      return rows.filter((l) => l.scope === "project");
    },
  });

  // Older-style member records (kept so they can still be cleaned up)
  const { data: members = [] } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => base44.entities.ProjectMember.filter({ project_id: projectId }),
  });

  const removeMember = useMutation({
    mutationFn: (id) => base44.entities.ProjectMember.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members", projectId] }); toast.success("Member removed"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> {links.length} guest{links.length !== 1 ? "s" : ""} with access
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowContacts(true)}>
            <BookUser className="w-4 h-4 mr-1" /> Contacts
          </Button>
          <Button size="sm" onClick={() => setShowShare(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Share
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Customers and team members open a private link — no account and no purchase needed.
      </p>

      {links.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No one has been given access yet. Tap Share to send a link.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <button key={l.id} onClick={() => setShowShare(true)}
              className={`w-full text-left bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 ${l.active === false ? "opacity-60" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(l.guest_name || l.guest_email || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{l.guest_name || l.guest_email}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {l.role === "team_member" ? "Team member" : "Customer"}{l.active === false ? " · link off" : l.last_opened ? ` · opened ${l.last_opened.slice(0, 10)}` : " · not opened yet"}
                </p>
              </div>
              {l.role === "team_member" ? <Wrench className="w-4 h-4 text-blue-400 shrink-0" /> : <Eye className="w-4 h-4 text-purple-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {members.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Earlier invites</p>
          {members.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user_name || m.user_email}</p>
                {m.user_name && <p className="text-xs text-muted-foreground truncate">{m.user_email}</p>}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button aria-label="Remove" className="inline-flex items-center justify-center h-11 w-11 -m-2 rounded-xl text-muted-foreground hover:text-destructive active:bg-accent transition-colors"><Trash2 className="w-4 h-4" /></button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Remove?</AlertDialogTitle><AlertDialogDescription>Remove {m.user_name || m.user_email} from this project's earlier invites?</AlertDialogDescription></AlertDialogHeader>
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

      <GuestLinkDialog
        open={showShare}
        onClose={() => setShowShare(false)}
        scope={{ type: "project", projectId, label: project?.name || "this project" }}
      />
      <ManageContactsDialog open={showContacts} onClose={() => setShowContacts(false)} />
    </div>
  );
}
