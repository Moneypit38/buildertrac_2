import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Layers, FolderKanban, Trash2, Pencil, UserPlus, Users } from "lucide-react";
import PortfolioIcon, { PORTFOLIO_ICONS, PORTFOLIO_COLORS, getColor, getIconComponent } from "../components/PortfolioIcon";
import { useClientAccess } from "../hooks/useClientAccess";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import InviteToPortfolioDialog from "../components/InviteToPortfolioDialog";
import CreateProjectDialog from "../components/CreateProjectDialog";
import PortfolioMembersDialog from "../components/PortfolioMembersDialog";


// ── Create / Edit Portfolio Dialog ──────────────────────────────────────────
function PortfolioFormDialog({ open, onClose, portfolio }) {
  const isEdit = !!portfolio;
  const [form, setForm] = useState({ name: portfolio?.name || "", description: portfolio?.description || "", icon: portfolio?.icon || "Layers", color: portfolio?.color || "orange", contact_name: portfolio?.contact_name || "", contact_email: portfolio?.contact_email || "", contact_phone: portfolio?.contact_phone || "", business_address: portfolio?.business_address || "" });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Portfolio.update(portfolio.id, data)
        : base44.entities.Portfolio.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success(isEdit ? "Portfolio updated!" : "Portfolio created!");
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary">{isEdit ? "Edit Portfolio" : "New Portfolio"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!form.name.trim()) return toast.error("Name required");
            mutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="West Coast Residential" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..." /></div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Information</p>
            <div className="space-y-3">
              <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Jane Smith" /></div>
              <div><Label>Business Address</Label><Input value={form.business_address} onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))} placeholder="123 Main St, Los Angeles, CA" /></div>
              <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="jane@company.com" /></div>
              <div><Label>Phone</Label><Input type="tel" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="(555) 123-4567" /></div>
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {PORTFOLIO_COLORS.map(c => (
                <button key={c.name} type="button" onClick={() => setForm(f => ({ ...f, color: c.name }))}
                  className={`w-7 h-7 rounded-full ${c.solid} transition-all ${form.color === c.name ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "opacity-60 hover:opacity-100"}`} />
              ))}
            </div>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {PORTFOLIO_ICONS.map(({ name, Icon }) => {
                const colorDef = getColor(form.color);
                return (
                  <button key={name} type="button" onClick={() => setForm(f => ({ ...f, icon: name }))}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${form.icon === name ? `${colorDef.bg} ${colorDef.text} border-current` : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Portfolio")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Portfolios() {
  const { data: portfolios = [], isLoading } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { isClientOnly, allowedProjectIds } = useClientAccess();
  const qc = useQueryClient();
  const location = useLocation();
  const portfolioRefs = useRef({});
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    const openId = location.state?.openPortfolioId;
    if (!openId || portfolios.length === 0) return;
    setHighlightedId(openId);
    setTimeout(() => {
      portfolioRefs.current[openId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    const timer = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(timer);
  }, [location.state?.openPortfolioId, portfolios]);

  const [showCreate, setShowCreate] = useState(false);
  const [editPortfolio, setEditPortfolio] = useState(null);
  const [addProjectToPortfolio, setAddProjectToPortfolio] = useState(null);
  const [invitePortfolio, setInvitePortfolio] = useState(null);
  const [teamPortfolio, setTeamPortfolio] = useState(null);

  const visibleProjects = allowedProjectIds
    ? projects.filter(p => allowedProjectIds.includes(p.id))
    : projects;

  const deletePortfolio = useMutation({
    mutationFn: (id) => base44.entities.Portfolio.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portfolio deleted"); },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const projectsByPortfolio = (portfolioName) => visibleProjects.filter(p => p.portfolio === portfolioName);
  const unassigned = visibleProjects.filter(p => !p.portfolio);

  // For clients, only show portfolios that contain at least one of their allowed projects
  const visiblePortfolios = isClientOnly
    ? portfolios.filter(pf => projectsByPortfolio(pf.name).length > 0)
    : portfolios;

  const statusStyle = (status) => {
    if (status === "In Progress") return "bg-blue-500/15 text-blue-400";
    if (status === "Completed") return "bg-green-500/15 text-green-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Portfolios
        </h1>
        {!isClientOnly && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Portfolio
          </Button>
        )}
      </div>

      {portfolios.length === 0 && unassigned.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No portfolios yet. Group your projects into portfolios.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePortfolios.map(pf => {
            const pfProjects = projectsByPortfolio(pf.name);
            return (
              <div key={pf.id} ref={el => portfolioRefs.current[pf.id] = el} className={`bg-card border rounded-xl overflow-hidden shadow-sm transition-all duration-500 ${highlightedId === pf.id ? "border-primary ring-2 ring-primary/40" : "border-border"}`} style={{borderTopColor: getColor(pf.color).name}}>
                {/* Portfolio Header */}
                <div className="px-5 pt-5 pb-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <PortfolioIcon icon={pf.icon} color={pf.color} size="sm" />
                      <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground leading-tight">{pf.name}</h2>
                      {pf.description && (
                        <p className="text-sm text-muted-foreground mt-1">{pf.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {pfProjects.length} project{pfProjects.length !== 1 ? "s" : ""}
                      </p>
                      {(pf.contact_name || pf.contact_email || pf.contact_phone || pf.business_address) && (
                        <div className="mt-2 space-y-0.5">
                          {pf.contact_name && <p className="text-xs text-foreground font-medium">{pf.contact_name}</p>}
                          {pf.business_address && <p className="text-xs text-muted-foreground">{pf.business_address}</p>}
                          {pf.contact_email && <p className="text-xs text-muted-foreground">{pf.contact_email}</p>}
                          {pf.contact_phone && <p className="text-xs text-muted-foreground">{pf.contact_phone}</p>}
                        </div>
                      )}
                    </div>
                    </div>

                    {/* Action buttons */}
                    {!isClientOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Invite Client */}
                        <button
                          onClick={() => setInvitePortfolio({ name: pf.name, projects: pfProjects })}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                          title="Invite Client"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                        {/* Manage Team */}
                        <button
                          onClick={() => setTeamPortfolio(pf)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                          title="Manage Team"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditPortfolio(pf)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                          title="Edit portfolio"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors" title="Delete portfolio">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
                              <AlertDialogDescription>This only removes the portfolio label — the projects inside won't be deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePortfolio.mutate(pf.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>

                {/* Projects list */}
                <div className="p-4 space-y-3">
                  {pfProjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No projects in this portfolio yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {pfProjects.map(p => (
                        <Link
                          key={p.id}
                          to={`/project/${p.id}`}
                          className="flex items-center gap-2.5 px-3 py-2.5 bg-background border border-border rounded-lg hover:border-primary/40 hover:bg-accent/30 transition-all text-sm group"
                        >
                          <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium flex-1 truncate">{p.name}</span>
                          {p.address && <span className="text-[11px] text-muted-foreground hidden sm:block truncate max-w-[140px]">{p.address}</span>}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle(p.status)}`}>{p.status}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {!isClientOnly && (
                    <button
                      onClick={() => setAddProjectToPortfolio(pf.name)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Project
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-4">
              <h2 className="font-semibold text-muted-foreground text-sm mb-3">Unassigned Projects</h2>
              <div className="space-y-1.5">
                {unassigned.map(p => (
                  <Link key={p.id} to={`/project/${p.id}`} className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary/40 transition-colors text-sm">
                    <FolderKanban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium flex-1 truncate">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle(p.status)}`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <PortfolioFormDialog key={showCreate ? "new" : "closed"} open={showCreate} onClose={() => setShowCreate(false)} />
      {addProjectToPortfolio && (
        <CreateProjectDialog open={!!addProjectToPortfolio} onClose={() => setAddProjectToPortfolio(null)} defaultPortfolio={addProjectToPortfolio} />
      )}
      {editPortfolio && (
        <PortfolioFormDialog open={!!editPortfolio} onClose={() => setEditPortfolio(null)} portfolio={editPortfolio} />
      )}
      {teamPortfolio && (
        <PortfolioMembersDialog
          open={!!teamPortfolio}
          onClose={() => setTeamPortfolio(null)}
          portfolio={teamPortfolio}
        />
      )}
      {invitePortfolio && (
        <InviteToPortfolioDialog
          open={!!invitePortfolio}
          onClose={() => setInvitePortfolio(null)}
          portfolioName={invitePortfolio.name}
          projects={invitePortfolio.projects}
        />
      )}
    </div>
  );
}