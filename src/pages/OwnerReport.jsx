import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Lock, PhoneCall, AlertTriangle } from "lucide-react";
import { useClientAccess } from "@/hooks/useClientAccess";
import { useAllLogEntries } from "@/hooks/useFollowUps";
import { planFor, countdown } from "@/lib/followUp";

const STATUSES = ["Planning", "In Progress", "On Hold", "Completed"];
const LABEL = { Planning: "Estimates", "In Progress": "In progress", "On Hold": "On hold", Completed: "Completed" };
const COLORS = {
  Planning: "bg-blue-500/20 text-blue-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "On Hold": "bg-red-500/20 text-red-400",
  Completed: "bg-green-500/20 text-green-400",
};
const DAY = 86400000;

function Tile({ value, label, warn }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className={`text-2xl font-extrabold font-display ${warn && value > 0 ? "text-orange-400" : ""}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium leading-tight mt-0.5">{label}</div>
    </div>
  );
}

// Business status report. Reads only records your account can see, and is hidden from client-only users.
export default function OwnerReport() {
  const { isClientOnly, isLoading } = useClientAccess();
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list(), staleTime: 0 });
  const { data: entries = [] } = useAllLogEntries();

  const data = useMemo(() => {
    const now = Date.now();
    const today = new Date().toLocaleDateString("en-CA");
    const lastContact = {};
    for (const e of entries) {
      const t = new Date(e.occurred_at || e.created_date).getTime();
      if (!isNaN(t) && (!lastContact[e.project_id] || t > lastContact[e.project_id])) lastContact[e.project_id] = t;
    }
    const overdue = {};
    for (const t of tasks) {
      if (!t.completed && t.status !== "Done" && t.due_date && t.due_date < today) overdue[t.project_id] = (overdue[t.project_id] || 0) + 1;
    }
    const rows = projects.map((p) => ({
      p, status: p.status || "Planning", plan: planFor(p, entries, now),
      daysAgo: lastContact[p.id] ? Math.floor((now - lastContact[p.id]) / DAY) : null,
      overdue: overdue[p.id] || 0,
    }));
    const names = portfolios.map((pf) => pf.name);
    const groups = names.map((name) => ({ name, rows: rows.filter((r) => r.p.portfolio === name) }));
    const loose = rows.filter((r) => !names.includes(r.p.portfolio));
    if (loose.length) groups.push({ name: "No portfolio", rows: loose });
    const count = (s) => rows.filter((r) => r.status === s).length;
    return { groups, count, total: rows.length, needFollowUp: rows.filter((r) => r.plan?.isDue).length, overdueJobs: rows.filter((r) => r.overdue > 0).length };
  }, [portfolios, projects, tasks, entries]);

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (isClientOnly) return <p className="p-6 text-center text-sm text-muted-foreground">This report isn't available for your account.</p>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div>
        <p className="text-xs text-muted-foreground font-medium">Owner /</p>
        <h1 className="text-2xl font-extrabold font-display">Business report</h1>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"><Lock className="w-3 h-3" /> Private. Only you can see this.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile value={data.total} label="Total jobs" />
        <Tile value={data.count("Planning")} label="Estimates" />
        <Tile value={data.count("In Progress")} label="In progress" />
        <Tile value={data.count("On Hold")} label="On hold" />
        <Tile value={data.needFollowUp} label="Need follow-up" warn />
        <Tile value={data.overdueJobs} label="Jobs with overdue tasks" warn />
      </div>

      {data.groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No portfolios or jobs yet.</p>}

      {data.groups.map((g) => (
        <section key={g.name} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-primary font-bold text-sm uppercase tracking-wider truncate">{g.name}</h2>
            <p className="text-[11px] text-muted-foreground shrink-0">
              {STATUSES.filter((s) => g.rows.some((r) => r.status === s)).map((s) => `${g.rows.filter((r) => r.status === s).length} ${LABEL[s].toLowerCase()}`).join(" · ") || "No jobs"}
            </p>
          </div>
          {g.rows.map((r) => (
            <Link key={r.p.id} to={`/project/${r.p.id}`} className="block bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate flex-1">{r.p.name}</p>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${COLORS[r.status] || ""}`}>{r.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                <span>{r.daysAgo === null ? "No contact logged" : r.daysAgo === 0 ? "Contacted today" : `Last contact ${r.daysAgo}d ago`}</span>
                {r.overdue > 0 && <span className="text-orange-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {r.overdue} overdue task{r.overdue === 1 ? "" : "s"}</span>}
                {r.plan && <span className={`font-semibold flex items-center gap-1 ${r.plan.isDue ? "text-primary" : ""}`}><PhoneCall className="w-3 h-3" /> {countdown(r.plan).text}</span>}
              </div>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
