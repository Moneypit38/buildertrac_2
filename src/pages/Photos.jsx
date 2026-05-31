import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PhotoCard from "../components/PhotoCard";
import { Camera } from "lucide-react";

export default function Photos() {
  const { data: photos = [], isLoading } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list() });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold font-display">Site Photos</h1>

      {photos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No site photos yet. Open a project to start capturing progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {photos.map(p => <PhotoCard key={p.id} photo={p} />)}
        </div>
      )}
    </div>
  );
}