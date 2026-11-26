import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Copy, Share2, Mail, Trash2, Power, Eye, Wrench, Check, ShieldCheck, MessageSquare } from "lucide-react";

const smsHref = (url) => `sms:?&body=${encodeURIComponent(`Here's your BuilderTrac link (no account needed): ${url}\n\nIf it opens the BuilderTrac app instead, press and hold the link and choose Open in Safari.`)}`;
import { toast } from "sonner";

// Guest links always point at the published web app, even when this screen
// is running inside the iOS wrapper.
const PUBLIC_URL = "https://mybuildertrac.base44.app";
export const guestUrl = (token) => `${PUBLIC_URL}/g/${token}`;

const makeToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const ROLES = [
  {
    value: "customer",
    label: "Customer",
    icon: Eye,
    blurb: "Sees the project, tasks, photos and documents. Can upload photos and documents. Nothing else.",
  },
  {
    value: "team_member",
    label: "Team member",
    icon: Wrench,
    blurb: "Everything a customer can do, plus see and post messages and change task status. Can't edit the project, budget or delete anything.",
  },
];
const ADMIN_ROLE = {
  value: "project_manager",
  label: "Project manager",
  icon: ShieldCheck,
  blurb: "Runs this one portfolio and every project in it: edit portfolio details, add/edit/delete projects and budgets, tasks, appointments, photos, documents and messages. Can't touch other portfolios, delete the portfolio, or create share links. Only give this to someone you trust — anyone with the link has this access.",
};
const roleLabel = (r) => (r === "team_member" ? "Team member" : r === "project_manager" ? "Project manager" : "Customer");

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function LinkRow({ link, onChanged }) {
  const [confirm, setConfirm] = useState(false);
  const url = guestUrl(link.token);
  const off = link.active === false;

  const copy = async () => (await copyText(url)) ? toast.success("Link copied") : toast.error("Couldn't copy. Press and hold the link to copy it.");
  const share = async () => {
    try { await navigator.share({ title: "BuilderTrac", text: "Here's your BuilderTrac link:", url }); } catch { /* cancelled */ }
  };
  const toggle = useMutation({
    mutationFn: () => base44.entities.ShareLink.update(link.id, { active: off }),
    onSuccess: () => { onChanged(); toast.success(off ? "Link turned on" : "Link turned off"); },
  });
  const remove = useMutation({
    mutationFn: () => base44.entities.ShareLink.delete(link.id),
    onSuccess: () => { onChanged(); toast.success("Link removed"); },
  });

  return (
    <div className={`bg-card border border-border rounded-xl px-3 py-2.5 space-y-2 ${off ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{link.guest_name || link.guest_email || "Unnamed guest"}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {roleLabel(link.role)}{link.guest_email && link.guest_name ? ` · ${link.guest_email}` : ""}{link.invited_by ? ` · invited by ${link.invited_by}` : ""}
            {link.last_opened ? ` · opened ${link.last_opened.slice(0, 10)}` : " · not opened yet"}
          </p>
        </div>
        {off && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Off</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" className="h-10 text-sm gap-1.5 px-3" onClick={copy}><Copy className="w-4 h-4" /> Copy</Button>
        <a href={smsHref(guestUrl(link.token))}><Button type="button" size="sm" variant="outline" className="h-10 text-sm gap-1.5 px-3"><MessageSquare className="w-4 h-4" /> Text</Button></a>
        {typeof navigator !== "undefined" && navigator.share && (
          <Button type="button" size="sm" variant="outline" className="h-10 text-sm gap-1.5 px-3" onClick={share}><Share2 className="w-4 h-4" /> Send</Button>
        )}
        <Button type="button" size="sm" variant="outline" className="h-10 text-sm gap-1.5 px-3" onClick={() => toggle.mutate()} disabled={toggle.isPending}>
          <Power className="w-4 h-4" /> {off ? "Turn on" : "Turn off"}
        </Button>
        {confirm ? (
          <>
            <Button type="button" size="sm" variant="destructive" className="h-10 text-sm px-3" onClick={() => remove.mutate()} disabled={remove.isPending}>Yes, remove</Button>
            <Button type="button" size="sm" variant="ghost" className="h-10 text-sm px-3" onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" className="h-10 text-sm px-3 text-muted-foreground hover:text-destructive gap-1.5" onClick={() => setConfirm(true)}>
            <Trash2 className="w-4 h-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Share access with a customer or team member through a private link — no account, no payment.
 * scope: { type: "project", projectId, label } or { type: "portfolio", portfolioName, portfolioId, label }
 */
export default function GuestLinkDialog({ open, onClose, scope }) {
  const qc = useQueryClient();
  const isProject = scope?.type === "project";
  const scopeKey = isProject ? scope.projectId : scope?.portfolioName;
  const [form, setForm] = useState({ guest_name: "", guest_email: "", role: "customer" });
  const [created, setCreated] = useState(null); // { url, emailed, name }

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: () => base44.entities.Contact.list(), enabled: open });
  const { data: links = [], refetch } = useQuery({
    queryKey: ["share-links", scope?.type, scopeKey],
    queryFn: async () => {
      const rows = isProject
        ? await base44.entities.ShareLink.filter({ project_id: scope.projectId })
        : await base44.entities.ShareLink.filter({ portfolio_name: scope.portfolioName });
      return rows.filter((l) => l.scope === scope.type).sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
    },
    enabled: open && !!scopeKey,
  });

  const create = useMutation({
    mutationFn: async (values) => {
      const token = makeToken();
      const ownerName = me?.full_name || me?.email || "";
      await base44.entities.ShareLink.create({
        token,
        role: values.role,
        scope: scope.type,
        project_id: isProject ? scope.projectId : undefined,
        portfolio_id: !isProject ? scope.portfolioId : undefined,
        portfolio_name: !isProject ? scope.portfolioName : undefined,
        guest_name: values.guest_name.trim(),
        guest_email: values.guest_email.trim(),
        active: true,
        owner_name: ownerName,
      });
      const url = guestUrl(token);

      let emailed = false;
      if (values.guest_email.trim()) {
        try {
          await base44.integrations.Core.SendEmail({
            to: values.guest_email.trim(),
            subject: `${ownerName || "Your contractor"} shared ${scope.label || "a project"} with you on BuilderTrac`,
            body:
              `Hi${values.guest_name.trim() ? " " + values.guest_name.trim() : ""},\n\n` +
              `${ownerName || "Your contractor"} has shared ${scope.label || "a project"} with you on BuilderTrac.\n\n` +
              `Open it here — no account or sign-up needed:\n${url}\n\n` +
              `If it opens the BuilderTrac app instead, press and hold the link and choose Open in Safari.\n\n` +
              `Keep this link private. Anyone who has it can open the project.\n\n— BuilderTrac`,
          });
          emailed = true;
        } catch { /* fall back to copy/share below */ }
      }
      return { url, emailed, name: values.guest_name.trim() || values.guest_email.trim() };
    },
    onSuccess: (res) => {
      setCreated(res);
      setForm({ guest_name: "", guest_email: "", role: form.role });
      qc.invalidateQueries({ queryKey: ["share-links"] });
      refetch();
      if (res.emailed) toast.success("Link emailed");
      else toast.message("Link created", { description: "Copy it or send it by text below." });
    },
    onError: () => toast.error("Couldn't create the link. Please try again."),
  });

  const close = () => { setCreated(null); onClose(); };
  // Admin links manage a whole portfolio, so they're only offered from a portfolio.
  const roleOptions = isProject ? ROLES : [...ROLES, ADMIN_ROLE];
  const activeRole = roleOptions.find((r) => r.value === form.role) || ROLES[0];

  const availableContacts = contacts.filter((c) => c.email);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2"><Link2 className="w-4 h-4" /> Share access</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-1">
          <span className="text-foreground font-medium">{scope?.label}</span> — they open a private link. No account, no app purchase.
        </p>

        {created && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> {created.emailed ? `Emailed to ${created.name}` : `Link ready for ${created.name || "your guest"}`}
            </p>
            <p className="text-[11px] break-all text-muted-foreground bg-background rounded-md p-2 select-all">{created.url}</p>
            <div className="flex gap-1.5">
              <Button type="button" size="sm" className="gap-1" onClick={async () => (await copyText(created.url)) ? toast.success("Link copied") : toast.error("Press and hold the link to copy it.")}><Copy className="w-4 h-4" /> Copy</Button>
              <a href={smsHref(created.url)}><Button type="button" size="sm" variant="outline" className="gap-1"><MessageSquare className="w-4 h-4" /> Text</Button></a>
              {typeof navigator !== "undefined" && navigator.share && (
                <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => navigator.share({ title: "BuilderTrac", text: "Here's your BuilderTrac link:", url: created.url }).catch(() => {})}><Share2 className="w-4 h-4" /> Text / share</Button>
              )}
            </div>
            {!created.emailed && created.name && (
              <p className="text-[11px] text-muted-foreground">No email was sent. Copy the link and text or email it yourself.</p>
            )}
          </div>
        )}

        <form
          className="space-y-3 bg-accent/40 border border-border rounded-xl p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.guest_name.trim() && !form.guest_email.trim()) return toast.error("Add a name or an email");
            setCreated(null);
            create.mutate(form);
          }}
        >
          <p className="text-sm font-medium">New link</p>

          {availableContacts.length > 0 && (
            <div>
              <Label className="text-xs">Pick from contacts</Label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1">
                {availableContacts.map((c) => (
                  <button key={c.id} type="button"
                    onClick={() => setForm((f) => ({ ...f, guest_name: c.name || "", guest_email: c.email || "" }))}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${form.guest_email === c.email ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Name</Label><Input className="h-9" value={form.guest_name} onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))} placeholder="Jane Smith" /></div>
            <div><Label className="text-xs">Email (optional)</Label><Input className="h-9" type="email" value={form.guest_email} onChange={(e) => setForm((f) => ({ ...f, guest_email: e.target.value }))} placeholder="jane@example.com" /></div>
          </div>

          <div>
            <Label className="text-xs">Access</Label>
            <div className={`grid ${roleOptions.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-2 mt-1`}>
              {roleOptions.map((r) => (
                <button key={r.value} type="button" onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg border px-1 py-2 transition-colors ${form.role === r.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                  <r.icon className="w-3.5 h-3.5 shrink-0" /> <span className="leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{activeRole?.blurb}</p>
          </div>

          <Button type="submit" className="w-full gap-1.5" disabled={create.isPending}>
            <Mail className="w-4 h-4" />
            {create.isPending ? "Creating…" : form.guest_email.trim() ? "Create link & email it" : "Create link"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">People with access ({links.length})</p>
          {links.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nobody yet.</p>
          ) : (
            links.map((l) => <LinkRow key={l.id} link={l} onChanged={() => { refetch(); qc.invalidateQueries({ queryKey: ["share-links"] }); }} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
