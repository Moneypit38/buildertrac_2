import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientAccess } from "../hooks/useClientAccess";
import { base44 } from "@/api/base44Client";
import DocumentCard from "../components/DocumentCard";
import { FileText } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

const categories = ["All", "Plans", "RFI", "Change Order", "Report", "Contract"];

export default function Documents() {
  const qc = useQueryClient();
  const { refreshing, touchHandlers } = usePullToRefresh(() => qc.invalidateQueries());
  const { data: docs = [], isLoading } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { allowedProjectIds } = useClientAccess();
  const [filter, setFilter] = useState("All");

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
  const visibleDocs = allowedProjectIds ? docs.filter(d => allowedProjectIds.includes(d.project_id)) : docs;
  const enriched = visibleDocs.map(d => ({ ...d, _projectName: projectMap[d.project_id] || "—" }));
  const filtered = filter === "All" ? enriched : enriched.filter(d => d.category === filter);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4" {...touchHandlers}>
      {refreshing && (
        <div className="flex justify-center pt-2"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      )}
      <h1 className="text-xl font-bold font-display">All Documents</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === c ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{filter === "All" ? "No documents uploaded yet." : `No ${filter} documents found.`}</p>
        </div>
      ) : (
        <div className="space-y-2">{filtered.map(d => <DocumentCard key={d.id} doc={d} showProject />)}</div>
      )}
    </div>
  );
}