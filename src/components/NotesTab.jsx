import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function NotesTab({ projectId }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => base44.entities.Note.filter({ project_id: projectId }, "-created_date"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const addNote = useMutation({
    mutationFn: (content) =>
      base44.entities.Note.create({
        project_id: projectId,
        content,
        author_name: currentUser?.full_name || "Unknown",
        author_email: currentUser?.email || "",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", projectId] });
      setDraft("");
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", projectId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addNote.mutate(draft.trim());
  };

  return (
    <div className="space-y-4">
      {/* Compose */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Add a note or comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!draft.trim() || addNote.isPending}
        >
          {addNote.isPending ? "Posting…" : "Post Note"}
        </Button>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No notes yet. Be the first to leave a comment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {(note.author_name || note.author_email || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold truncate">{note.author_name || note.author_email}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(note.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap pl-9">{note.content}</p>
                </div>
                {note.author_email === currentUser?.email || currentUser?.role === "admin" ? (
                  <button
                    onClick={() => deleteNote.mutate(note.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}