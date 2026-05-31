import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, FolderKanban } from "lucide-react";
import { toast } from "sonner";

export default function InviteToPortfolioDialog({ open, onClose, portfolioName, projects = [] }) {
  const [form, setForm] = useState({ user_name: "", user_email: "" });
  const qc = useQueryClient();

  const invite = useMutation({
    mutationFn: async ({ user_name, user_email }) => {
      // Create a client membership for every project in this portfolio
      await Promise.all(
        projects.map(p =>
          base44.entities.ProjectMember.create({
            project_id: p.id,
            user_name,
            user_email,
            role: "client",
          })
        )
      );
      // Invite them to the app as a regular user
      await base44.users.inviteUser(user_email, "user");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success(`Invite sent to ${form.user_email}!`);
      setForm({ user_name: "", user_email: "" });
      onClose();
    },
    onError: () => toast.error("Failed to send invite. Please try again."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.user_email.trim()) return toast.error("Email is required");
    invite.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="w-5 h-5" /> Invite Client to Portfolio
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-lg text-sm text-muted-foreground mb-1">
          <FolderKanban className="w-4 h-4 text-primary shrink-0" />
          <span><span className="text-foreground font-medium">{portfolioName}</span> — {projects.length} project{projects.length !== 1 ? "s" : ""}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          The client will get access to all projects in this portfolio — they can upload and download docs &amp; photos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Client Name</Label>
            <Input
              value={form.user_name}
              onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <Label>Client Email *</Label>
            <Input
              type="email"
              value={form.user_email}
              onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
              placeholder="jane@example.com"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={invite.isPending}>
              {invite.isPending ? "Sending..." : "Send Invite"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}