import { Trash2, User, CalendarDays } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function PhotoCard({ photo }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => base44.entities.SitePhoto.delete(photo.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success("Photo removed"); },
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-all">
      <div className="relative aspect-video bg-accent">
        {photo.photo_url ? (
          <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="font-semibold text-sm text-white drop-shadow-lg">{photo.title}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur rounded-lg p-1.5 text-white hover:text-destructive transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove "{photo.title}".</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {photo.description && <p className="text-xs text-muted-foreground px-3 pt-2 line-clamp-2">{photo.description}</p>}
      <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-3">
        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {photo.created_by || "—"}</span>
        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {photo.created_date?.slice(0, 10) || ""}</span>
      </div>
    </div>
  );
}