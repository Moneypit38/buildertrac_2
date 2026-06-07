import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "./ResponsiveSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, User, Search } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const roleLabels = { admin: "Admin", team_member: "Team Member", client: "Client" };

const blank = { name: "", email: "", phone: "", company: "", default_role: "team_member", notes: "" };

export default function ManageContactsDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list(),
  });

  const saveContact = useMutation({
    mutationFn: (data) =>
      editId ? base44.entities.Contact.update(editId, data) : base44.entities.Contact.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(editId ? "Contact updated" : "Contact saved");
      setForm(blank);
      setShowForm(false);
      setEditId(null);
    },
  });

  const deleteContact = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts"] }); toast.success("Contact deleted"); },
  });

  const handleEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone || "", company: c.company || "", default_role: c.default_role || "team_member", notes: c.notes || "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error("Name and email are required");
    saveContact.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Contacts</DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setForm(blank); setEditId(null); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> New Contact
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or company…"
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Role filter tabs */}
            <div className="flex gap-1 bg-accent rounded-lg p-0.5 w-fit">
              {[["all", "All"], ["team_member", "Team"], ["client", "Clients"], ["admin", "Admins"]].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setRoleFilter(val)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${roleFilter === val ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>

            {(() => {
              const filtered = contacts.filter(c => {
                const matchesRole = roleFilter === "all" || c.default_role === roleFilter;
                const q = search.toLowerCase();
                const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
                return matchesRole && matchesSearch;
              });

              return contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No contacts yet. Add people you work with frequently.
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No contacts match your search.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map(c => (
                  <div key={c.id} className="bg-accent/40 border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {c.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      {roleLabels[c.default_role] || c.default_role}
                    </span>
                    <button onClick={() => handleEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 text-xs underline">Edit</button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete contact?</AlertDialogTitle><AlertDialogDescription>Remove {c.name} from your contacts list?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteContact.mutate(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            );
            })()}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium">{editId ? "Edit Contact" : "New Contact"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="555-1234" /></div>
              <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc." /></div>
            </div>
            <div>
              <Label>Default Role</Label>
              <ResponsiveSelect
                value={form.default_role}
                onValueChange={v => setForm(f => ({ ...f, default_role: v }))}
                options={[
                  { value: "team_member", label: "Team Member" },
                  { value: "client", label: "Client" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." /></div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saveContact.isPending}>{saveContact.isPending ? "Saving..." : editId ? "Update" : "Save Contact"}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}