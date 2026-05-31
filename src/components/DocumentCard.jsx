import { FileText, Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function DocumentCard({ doc, showProject }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => base44.entities.Document.delete(doc.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Document removed"); },
  });

  return (
    <div className="bg-background rounded-xl p-3 border border-border/50 group hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{doc.name}</p>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">v{doc.version || 1}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {doc.category}{showProject ? ` · ${doc._projectName || ""}` : ""} · {doc.size || "—"} · {doc.created_date?.slice(0, 10) || ""}
          </p>
          {doc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors p-1">
              <Download className="w-4 h-4" />
            </a>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete document?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove "{doc.name}".</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}