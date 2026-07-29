import { useState } from "react";
import { FileText, Download, Trash2, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

function getFileType(url = "") {
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(jpg|jpeg|png|gif|webp|heic|svg)/.test(lower)) return "image";
  if (/\.pdf/.test(lower)) return "pdf";
  return "other";
}

function DocViewer({ doc, onClose }) {
  const type = getFileType(doc.file_url);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{doc.name}</p>
          <p className="text-[11px] text-muted-foreground">{doc.category}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <a href={doc.file_url} download target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors p-1">
            <Download className="w-4 h-4" />
          </a>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-black/10 p-2">
        {type === "image" && (
          <img src={doc.file_url} alt={doc.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
        )}
        {type === "pdf" && (
          <iframe src={doc.file_url} title={doc.name} className="w-full h-full rounded-lg border border-border" />
        )}
        {type === "other" && (
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary underline">
              <ExternalLink className="w-4 h-4" /> Open file
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentCard({ doc, showProject, canDelete = true }) {
  const [viewing, setViewing] = useState(false);
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => base44.entities.Document.delete(doc.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Document removed"); },
  });

  return (
    <>
      {viewing && <DocViewer doc={doc} onClose={() => setViewing(false)} />}
      <div
        className="bg-background rounded-xl p-3 border border-border/50 group hover:border-primary/30 transition-all cursor-pointer"
        onClick={() => doc.file_url && setViewing(true)}
      >
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
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {canDelete && (
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}