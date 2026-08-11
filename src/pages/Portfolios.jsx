import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Layers, FolderKanban, Trash2, Pencil, UserPlus, Users, MoveRight, Sparkles, ImageIcon, Upload } from "lucide-react";
import TeamMemberGate from "@/components/TeamMemberGate";
import PortfolioIcon, { PORTFOLIO_ICONS, PORTFOLIO_COLORS, getColor, getIconComponent } from "../components/PortfolioIcon";
import { useClientAccess } from "../hooks/useClientAccess";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import InviteToPortfolioDialog from "../components/InviteToPortfolioDialog";
import CreateProjectDialog from "../components/CreateProjectDialog";
import PortfolioMembersDialog from "../components/PortfolioMembersDialog";
import AssignPortfolioDialog from "../components/AssignPortfolioDialog";


// ── Create / Edit Portfolio Dialog ──────────────────────────────────────────
function PortfolioFormDialog({ open, onClose, portfolio }) {
  const isEdit = !!portfolio;
  const [form, setForm] = useState({ name: portfolio?.name || "", description: portfolio?.description || "", icon: portfolio?.icon || "Layers", color: portfolio?.color || "orange", contact_name: portfolio?.contact_name || "", contact_email: portfolio?.contact_email || "", contact_phone: portfolio?.contact_phone || "", business_address: portfolio?.business_address || "", logo_url: portfolio?.logo_url || "" });
  const [logoSearching, setLogoSearching] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const qc = useQueryClient();

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, logo_url: file_url }));
      toast.success("Logo uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const searchLogo = async () => {
    if (!form.name.trim()) return toast.error("Enter a company name first");
    setLogoSearching(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A user wants the logo for the company "${form.name}". Use web search to find this company's OFFICIAL website domain (for example "apple.com", "hammonddev.com"). Then return that domain and a direct logo image URL. A reliable logo URL is https://logo.clearbit.com/<domain>. Respond with JSON only.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            website: { type: "string" },
            logo_url: { type: "string" },
          },
          required: ["website", "logo_url"],
        },
      });
      const website = (res?.website || "").trim();
      let url = (res?.logo_url || "").trim();
      // Prefer a Clearbit URL built from the discovered official domain — reliable for real companies
      if (website) {
        const domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
        if (domain) url = `https://logo.clearbit.com/${domain}`;
      }
      if (url && /^https?:\/\//.test(url)) {
        setForm(f => ({ ...f, logo_url: url }));
        toast.success("Logo found!");
      } else {
        toast.error("Couldn't find a logo. Try entering a URL manually.");
      }
    } catch {
      toast.error("Logo search failed");
    } finally {
      setLogoSearching(false);
    }
  };

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

          {/* Logo finder */}
          <div>
            <Label>Company Logo</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                placeholder="Logo URL (or upload / AI search)"
                className="flex-1"
              />
              <label className="shrink-0">
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={logoUploading} />
                <Button type="button" variant="outline" size="sm" disabled={logoUploading} asChild>
                  <span className="gap-1.5 cursor-pointer">
                    {logoUploading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {logoUploading ? "..." : "Upload"}
                  </span>
                </Button>
              </label>
              <Button type="button" variant="outline" size="sm" onClick={searchLogo} disabled={logoSearching} className="shrink-0 gap-1.5">
                {logoSearching ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {logoSearching ? "..." : "Find"}
              </Button>
            </div>
            {form.logo_url ? (
              <div className="mt-2 flex items-center gap-2">
                <img src={form.logo_url} alt="logo preview" className="h-10 w-10 object-contain rounded border border-border bg-white p-1 shrink-0" onError={e => { e.target.style.display = "none"; }} />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {form.logo_url.startsWith("blob:") || form.logo_url.length > 40 ? "Image uploaded ✓" : form.logo_url}
                </span>
                <button type="button" onClick={() => setForm(f => ({ ...f, logo_url: "" }))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">Remove</button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="w-3 h-3" /> Type a company name above then click "Find Logo"
              </div>
            )}
          </div>

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
  const { data: photos = [] } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });
  const { isClientOnly, allowedProjectIds } = useClientAccess();
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [assignProject, setAssignProject] = useState(null);
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

  // Completion % for a portfolio's projects
  const getCompletion = (pfProjects) => {
    if (!pfProjects.length) return 0;
    const done = pfProjects.filter(p => p.status === "Completed").length;
    return Math.round((done / pfProjects.length) * 100);
  };

  // Unique statuses for a portfolio
  const getStatuses = (pfProjects) => {
    const counts = {};
    pfProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts);
  };

  const statusBadgeStyle = (status) => {
    if (status === "In Progress") return "bg-blue-500/20 text-blue-400";
    if (status === "Completed") return "bg-green-500/20 text-green-400";
    if (status === "On Hold") return "bg-orange-500/20 text-orange-400";
    if (status === "Planning") return "bg-purple-500/20 text-purple-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Your Work /</p>
          <h1 className="text-2xl font-extrabold font-display">Portfolios</h1>
        </div>
        <TeamMemberGate action="create new portfolios">
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </TeamMemberGate>
      </div>

      {portfolios.length === 0 && unassigned.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No portfolios yet. Group your projects into portfolios.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 2-column card grid */}
          <div className="grid grid-cols-2 gap-3">
            {visiblePortfolios.map(pf => {
              const pfProjects = projectsByPortfolio(pf.name);
              const pfProjectIds = new Set(pfProjects.map(p => p.id));
              const pfPhotos = photos.filter(ph => pfProjectIds.has(ph.project_id) && ph.photo_url);
              const completion = getCompletion(pfProjects);
              const statuses = getStatuses(pfProjects);
              const colorDef = getColor(pf.color);
               return (
                 <div key={pf.id} ref={el => portfolioRefs.current[pf.id] = el}
                   className={`bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/40 ${highlightedId === pf.id ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
                   {/* Card tap → open portfolio detail page */}
                   <button
                     className="w-full text-left p-3 space-y-2"
                     onClick={() => navigate(`/portfolio/${pf.id}`)}
                   >
                    {/* Icon + actions row */}
                    <div className="flex items-start justify-between">
                      <PortfolioIcon icon={pf.icon} color={pf.color} size="sm" logoUrl={pf.logo_url} />
                      {!isClientOnly && (
                        <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditPortfolio(pf)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-accent transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
                                <AlertDialogDescription>This only removes the portfolio label — projects won't be deleted.</AlertDialogDescription>
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

                    {/* Name + count */}
                    <div>
                      <p className="font-bold text-sm leading-tight">{pf.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{pfProjects.length} Project{pfProjects.length !== 1 ? "s" : ""}</p>
                    </div>

                    {/* Status badges */}
                    {statuses.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {statuses.slice(0, 2).map(([status, count]) => (
                          <span key={status} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadgeStyle(status)}`}>
                            {status}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colorDef.solid}`} style={{ width: `${completion}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{completion}% Complete</p>
                    </div>

                    {/* Photo strip */}
                    {pfPhotos.length > 0 && (
                      <div className="flex gap-1 pt-1">
                        {pfPhotos.slice(0, 3).map((ph, i) => (
                          <img key={i} src={ph.photo_url} alt="" className="w-full flex-1 h-10 object-cover rounded" style={{ maxWidth: `calc(100% / ${Math.min(pfPhotos.length, 3)})` }} />
                        ))}
                      </div>
                    )}
                  </button>

                </div>
              );
            })}
          </div>

          {unassigned.length > 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-4">
              <h2 className="font-semibold text-muted-foreground text-sm mb-3">Unassigned Projects</h2>
              <div className="space-y-1.5">
                {unassigned.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <FolderKanban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <Link to={`/project/${p.id}`} className="font-medium flex-1 truncate hover:text-primary transition-colors">{p.name}</Link>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadgeStyle(p.status)}`}>{p.status}</span>
                    {!isClientOnly && (
                      <button
                        onClick={() => setAssignProject(p)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-2 py-1 rounded-md transition-colors shrink-0"
                      >
                        <Layers className="w-3 h-3" /> Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <PortfolioFormDialog key={showCreate ? "new" : "closed"} open={showCreate} onClose={() => setShowCreate(false)} />
      {addProjectToPortfolio && (
        <CreateProjectDialog key={addProjectToPortfolio} open={!!addProjectToPortfolio} onClose={() => setAddProjectToPortfolio(null)} defaultPortfolio={addProjectToPortfolio} />
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
      {assignProject && (
        <AssignPortfolioDialog open={!!assignProject} onClose={() => setAssignProject(null)} project={assignProject} />
      )}
    </div>
  );
}