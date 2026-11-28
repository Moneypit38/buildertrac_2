import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eraser, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { findOrphans, deleteOrphans, orphanLabel } from "@/lib/projectCleanup";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Settings row: finds leftovers from projects that were deleted earlier, shows them, deletes on confirm.
export default function OrphanCleanup() {
  const qc = useQueryClient();
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);

  const total = found ? Object.values(found).reduce((n, a) => n + a.length, 0) : 0;

  const scan = async () => {
    setBusy(true);
    try {
      const f = await findOrphans();
      const n = Object.values(f).reduce((x, a) => x + a.length, 0);
      if (n === 0) toast.success("Nothing left over. Everything belongs to a project.");
      else setFound(f);
    } catch { toast.error("Couldn't check. Try again."); }
    setBusy(false);
  };

  const clear = async () => {
    setBusy(true);
    try {
      await deleteOrphans(found);
      qc.invalidateQueries();
      toast.success(`Removed ${total} leftover item${total === 1 ? "" : "s"}`);
      setFound(null);
    } catch { toast.error("Something went wrong. Some items may remain."); }
    setBusy(false);
  };

  const rows = found ? Object.entries(found).flatMap(([name, list]) => list.map((r) => ({ key: name + r.id, text: orphanLabel(name, r) }))) : [];

  return (
    <>
      <button
        onClick={scan}
        disabled={busy}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-accent transition-colors min-h-[52px]"
      >
        <div className="flex items-center gap-3">
          <Eraser className="w-4 h-4 text-muted-foreground" />
          <div className="text-left">
            <p className="text-sm font-medium">{busy && !found ? "Checking..." : "Clean up leftovers"}</p>
            <p className="text-xs text-muted-foreground">Items from projects that were deleted</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      <AlertDialog open={!!found} onOpenChange={(v) => !v && setFound(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {total} leftover item{total === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              These belong to projects that no longer exist. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 text-xs space-y-1">
            {rows.slice(0, 60).map((r) => <p key={r.key} className="truncate">{r.text}</p>)}
            {rows.length > 60 && <p className="text-muted-foreground">and {rows.length - 60} more</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Keep them</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); clear(); }} disabled={busy} className="bg-destructive text-destructive-foreground min-h-[44px]">
              {busy ? "Deleting..." : "Delete them"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
