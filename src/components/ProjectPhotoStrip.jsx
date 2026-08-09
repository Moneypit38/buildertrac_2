import { useState } from "react";
import { Camera } from "lucide-react";
import { PhotoExpanded } from "./PhotoGrid";

export default function ProjectPhotoStrip({ photos = [], projectName }) {
  const [selected, setSelected] = useState(null);

  if (!photos.length) return null;
  const preview = photos.filter(p => p.photo_url).slice(0, 5);
  if (!preview.length) return null;
  const extra = photos.length - preview.length;

  return (
    <>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Site Photos
          </p>
          <span className="text-[11px] text-muted-foreground">{photos.length}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {preview.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-accent hover:ring-2 hover:ring-primary/50 transition-all active:scale-95"
            >
              <img src={p.photo_url} alt={p.title} className="w-full h-full object-cover" />
            </button>
          ))}
          {extra > 0 && (
            <div className="shrink-0 w-12 h-16 rounded-lg bg-accent flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
              +{extra}
            </div>
          )}
        </div>
      </div>
      {selected && (
        <PhotoExpanded photo={selected} onClose={() => setSelected(null)} canDelete={false} projectName={projectName} />
      )}
    </>
  );
}