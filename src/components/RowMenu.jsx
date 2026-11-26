import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import IconButton from "./IconButton";

// One "⋯" button that opens a menu with Edit and Delete (delete asks for confirmation).
// Replaces rows of tiny pencil / trash icons that were hard to hit on a phone.
export default function RowMenu({ onEdit, onDelete, deleteTitle = "Delete this?", deleteText = "This cannot be undone.", editLabel = "Edit", deleteLabel = "Delete" }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton aria-label="More actions"><MoreHorizontal className="w-5 h-5" /></IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          {onEdit && (
            <DropdownMenuItem className="min-h-[44px] text-sm gap-2" onSelect={() => onEdit()}>
              <Pencil className="w-4 h-4" /> {editLabel}
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem className="min-h-[44px] text-sm gap-2 text-destructive focus:text-destructive" onSelect={() => setConfirming(true)}>
              <Trash2 className="w-4 h-4" /> {deleteLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onDelete && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>{deleteText}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
              <AlertDialogAction className="h-11 bg-destructive text-destructive-foreground" onClick={() => onDelete()}>{deleteLabel}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
