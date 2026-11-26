import { useNavigate } from "react-router-dom";
import { Layers, FolderKanban, Share2, ArrowRight } from "lucide-react";

const ROLE = { customer: "Customer", team_member: "Team member", project_manager: "Project manager" };

function SharedBadge({ role }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/15 text-primary">
      <Share2 className="w-2.5 h-2.5" /> Shared · {ROLE[role] || "Guest"}
    </span>
  );
}

// Shared portfolios, styled like the user's own portfolio cards (for the 2-column grid).
export function SharedPortfolioCards({ shared }) {
  const navigate = useNavigate();
  return shared
    .filter((s) => s.data.portfolio_name)
    .map(({ job, data }) => (
      <div key={job.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-primary/40">
        <button className="w-full text-left p-3 space-y-2" onClick={() => navigate(`/shared/${job.token}`)}>
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{data.portfolio_name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {(data.projects || []).length} Project{(data.projects || []).length !== 1 ? "s" : ""}
              {data.owner_name ? ` · ${data.owner_name}` : ""}
            </p>
          </div>
          <SharedBadge role={data.role} />
        </button>
      </div>
    ));
}

// Shared projects, as rows for the Projects list.
export function SharedProjectCards({ shared }) {
  const navigate = useNavigate();
  const rows = shared.flatMap(({ job, data }) => (data.projects || []).map((p) => ({ job, data, p })));
  return rows.map(({ job, data, p }) => (
    <button
      key={`${job.id}-${p.id}`}
      onClick={() => navigate(`/shared/${job.token}?project=${p.id}`)}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors flex items-center gap-3"
    >
      <FolderKanban className="w-5 h-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-bold truncate">{p.name}</p>
        {p.address && <p className="text-xs text-muted-foreground truncate">{p.address}</p>}
        <SharedBadge role={data.role} />
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  ));
}
