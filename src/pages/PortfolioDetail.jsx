import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus, Pencil, Trash2, UserPlus, Users, MapPin, Mail, Phone, Layers } from "lucide-react";
import PortfolioIcon, { getColor } from "@/components/PortfolioIcon";
import TeamMemberGate from "@/components/TeamMemberGate";
import { useClientAccess } from "@/hooks/useClientAccess";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import PortfolioMembersDialog from "@/components/PortfolioMembersDialog";
import InviteToPortfolioDialog from "@/components/InviteToPortfolioDialog";

// Local copy of PortfolioFormDialog (kept here so the detail page is self-contained)
function PortfolioFormDialog({ open, onClose, portfolio }) {
  const isEdit = !!portfolio;
  const [form, setForm] = useState({
    name: portfolio?.name || "", description: portfolio?.description || "",
    icon: portfolio?.icon || "Layers", color: portfolio?.color || "orange",
    contact_name: portfolio?.contact_name || "", contact_email: portfolio?.contact_email || "",
    contact_phone: portfolio?.contact_phone || "", business_address: portfolio?.business_address || "",
    logo_url: portfolio?.logo_url || "",
  });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Portfolio.update(portfolio.id, data) : base44.entities.Portfolio.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success(isEdit ? "Portfolio updated!" : "Portfolio created!"); onClose(); },
  });
  // Minimal edit form — full form lives in Portfolios.jsx, but here we only need quick edits
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quick edit</AlertDialogTitle>
          <AlertDialogDescription>Use the Portfolios tab for full editing options.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <label className="text-sm font-medium">Name</label>
          <input className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <label className="text-sm font-medium">Description</label>
          <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (form.name.trim()) mutation.mutate(form); }}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const statusBadgeStyle = (status) => {
  if (status === "In Progress") return "bg-blue-500/20 text-blue-400";
  if (status === "Completed") return "bg-green-500/20 text-green-400";
  if (status === "On Hold") return "bg-orange-500/20 text-orange-400";
  if (status === "Planning") return "bg-purple-500/20 text-purple-400";
  return "bg-muted text-muted-foreground";
};

export default function PortfolioDetail() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isClientOnly } = useClientAccess();

  const { data: portfolio, isLoading: pfLoading } = useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => base44.entities.Portfolio.get(portfolioId),
    enabled: !!portfolioId,
  });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: photos = [] } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });

  const [showDirections, setShowDirections] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [addProject, setAddProject] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const deletePortfolio = useMutation({
    mutationFn: () => base44.entities.Portfolio.delete(portfolioId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portfolio deleted"); navigate("/portfolios"); },
  });

  if (pfLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!portfolio) return (
    <div className="p-6 text-center text-muted-foreground">Portfolio not found.</div>
  );

  const pfProjects = projects.filter(p => p.portfolio === portfolio.name);
  const pfProjectIds = new Set(pfProjects.map(p => p.id));
  const pfPhotos = photos.filter(ph => pfProjectIds.has(ph.project_id) && ph.photo_url);
  const completion = pfProjects.length
    ? Math.round(pfProjects.filter(p => p.status === "Completed").length / pfProjects.length * 100)
    : 0;
  const colorDef = getColor(portfolio.color);

  const statusCounts = {};
  pfProjects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
  const statuses = Object.entries(statusCounts);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Portfolio header card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <PortfolioIcon icon={portfolio.icon} color={portfolio.color} size="md" logoUrl={portfolio.logo_url} />
            {!isClientOnly && (
              <div className="flex gap-1">
                <button onClick={() => setShowEdit(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-extrabold font-display leading-tight">{portfolio.name}</h1>
            {portfolio.description && <p className="text-sm text-muted-foreground mt-1.5">{portfolio.description}</p>}
            <p className="text-xs text-muted-foreground mt-2">{pfProjects.length} Project{pfProjects.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Status + progress */}
          <div className="space-y-2">
            {statuses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {statuses.map(([status, count]) => (
                  <span key={status} className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusBadgeStyle(status)}`}>
                    {status} · {count}
                  </span>
                ))}
              </div>
            )}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${colorDef.solid}`} style={{ width: `${completion}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{completion}% Complete</p>
          </div>

          {/* Photo strip */}
          {pfPhotos.length > 0 && (
            <div className="flex gap-1.5">
              {pfPhotos.slice(0, 4).map((ph, i) => (
                <img key={i} src={ph.photo_url} alt="" className="h-16 w-full flex-1 object-cover rounded-lg" />
              ))}
            </div>
          )}

          {/* Contact info */}
          {(portfolio.contact_name || portfolio.contact_email || portfolio.contact_phone || portfolio.business_address) && (
            <div className="border-t border-border pt-3 space-y-1.5 text-xs text-muted-foreground">
              {portfolio.contact_name && <div className="flex items-center gap-2"><span className="font-medium text-foreground">{portfolio.contact_name}</span></div>}
              {portfolio.business_address && <button onClick={() => setShowDirections(true)} className="flex items-center gap-2 hover:text-primary transition-colors text-left w-full"><MapPin className="w-3 h-3 shrink-0" /><span>{portfolio.business_address}</span></button>}
              {portfolio.contact_email && <a href={`mailto:${portfolio.contact_email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="w-3 h-3 shrink-0" />{portfolio.contact_email}</a>}
              {portfolio.contact_phone && <a href={`tel:${portfolio.contact_phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="w-3 h-3 shrink-0" /><span>{portfolio.contact_phone}</span></a>}
            </div>
          )}

          {/* Admin actions */}
          {!isClientOnly && (
            <div className="flex gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4 mr-1" /> Invite</Button>
              <Button variant="outline" size="sm" onClick={() => setTeamOpen(true)}><Users className="w-4 h-4 mr-1" /> Team</Button>
            </div>
          )}
        </div>
      </div>

      {/* Projects section */}
      <div className="mt-5 px-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Projects</h2>
          {!isClientOnly && (
            <TeamMemberGate action="add projects">
              <Button size="sm" variant="ghost" onClick={() => setAddProject(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </TeamMemberGate>
          )}
        </div>

        {pfProjects.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No projects in this portfolio yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pfProjects.map(p => (
              <Link key={p.id} to={`/project/${p.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 hover:border-primary/40 hover:bg-accent/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <FolderKanban className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  {p.address && <p className="text-xs text-muted-foreground truncate">{p.address}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadgeStyle(p.status)}`}>{p.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Empty-state with link back */}
      <div className="mt-6 text-center">
        <Link to="/portfolios" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <Layers className="w-3 h-3" /> All portfolios
        </Link>
      </div>

      {/* Dialogs */}
      {showEdit && <PortfolioFormDialog open={showEdit} onClose={() => setShowEdit(false)} portfolio={portfolio} />}
      <AlertDialog open={showDirections} onOpenChange={setShowDirections}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Get directions?</AlertDialogTitle>
            <AlertDialogDescription>{portfolio.business_address}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(portfolio.business_address)}`, "_blank")}>Get Directions</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
            <AlertDialogDescription>This only removes the portfolio label — projects won't be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePortfolio.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {addProject && (
        <CreateProjectDialog key={portfolio.name} open={!!addProject} onClose={() => setAddProject(false)} defaultPortfolio={portfolio.name} />
      )}
      {teamOpen && (
        <PortfolioMembersDialog open={!!teamOpen} onClose={() => setTeamOpen(false)} portfolio={portfolio} />
      )}
      {inviteOpen && (
        <InviteToPortfolioDialog open={!!inviteOpen} onClose={() => setInviteOpen(false)} portfolioName={portfolio.name} projects={pfProjects} />
      )}
    </div>
  );
}