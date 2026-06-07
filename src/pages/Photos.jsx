import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useClientAccess } from "../hooks/useClientAccess";
import PhotoGrid from "../components/PhotoGrid";
import { Camera } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

export default function Photos() {
  const qc = useQueryClient();
  const { refreshing, touchHandlers } = usePullToRefresh(() => qc.invalidateQueries());
  const { data: photos = [], isLoading } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });
  const { allowedProjectIds } = useClientAccess();
  const visiblePhotos = allowedProjectIds ? photos.filter(p => allowedProjectIds.includes(p.project_id)) : photos;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4" {...touchHandlers}>
      {refreshing && (
        <div className="flex justify-center pt-2"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      )}
      <h1 className="text-xl font-bold font-display">Site Photos</h1>

      {visiblePhotos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No site photos yet. Open a project to start capturing progress.</p>
        </div>
      ) : (
        <PhotoGrid photos={visiblePhotos} />
      )}
    </div>
  );
}