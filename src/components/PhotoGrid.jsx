import { useState } from "react";
import { Trash2, User, CalendarDays, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { markPhotoSeen } from "../lib/viewedContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

function PhotoThumbnail({ photo, canDelete, onSelect }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => base44.entities.SitePhoto.delete(photo.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success("Photo removed"); },
  });

  return (
    <div
      onClick={() => onSelect(photo)}
      className="relative aspect-square rounded-lg overflow-hidden bg-accent cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
    >
      {photo.photo_url ? (
        <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="absolute bottom-1 left-1 right-1 text-white text-[10px] font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity px-0.5">{photo.title}</p>

      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={e => e.stopPropagation()}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur rounded p-1 text-white hover:text-destructive transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete photo?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove "{photo.title}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function PhotoExpanded({ photo, onClose, canDelete }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => base44.entities.SitePhoto.delete(photo.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success("Photo removed"); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          {photo.photo_url ? (
            <img src={photo.photo_url} alt={photo.title} className="w-full object-contain max-h-[55vh]" />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-accent text-muted-foreground">No image</div>
          )}
          <button onClick={onClose} className="absolute top-2 right-2 bg-black/50 backdrop-blur rounded-lg p-1.5 text-white hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          <h3 className="font-semibold text-base">{photo.title}</h3>
          {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {photo.created_by || "—"}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {photo.created_date?.slice(0, 10) || ""}</span>
          </div>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs text-destructive flex items-center gap-1 mt-1 hover:underline">
                  <Trash2 className="w-3 h-3" /> Delete photo
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete photo?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove "{photo.title}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PhotoGrid({ photos = [], canDelete = true }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (photo) => {
    markPhotoSeen(photo.id);
    setSelected(photo);
  };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map(p => (
          <PhotoThumbnail key={p.id} photo={p} canDelete={canDelete} onSelect={handleSelect} />
        ))}
      </div>
      {selected && <PhotoExpanded photo={selected} onClose={() => setSelected(null)} canDelete={canDelete} />}
    </>
  );
}