import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotesTab({ projectId }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => base44.entities.Note.filter({ project_id: projectId }, "created_date"),
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

  // Scroll to bottom when messages load or new one added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    if (!draft.trim() || addNote.isPending) return;
    addNote.mutate(draft.trim());
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ height: "60vh", minHeight: "400px" }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
          </div>
        ) : (
          <>
            {notes.map((note) => {
              const isMe = note.author_email === currentUser?.email;
              const initials = (note.author_name || note.author_email || "?")[0].toUpperCase();
              return (
                <div key={note.id} className={cn("flex gap-2 group", isMe ? "flex-row-reverse" : "flex-row")}>
                  {/* Avatar */}
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1",
                    isMe ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"
                  )}>
                    {initials}
                  </div>

                  {/* Bubble */}
                  <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                    {/* Name + time */}
                    <div className={cn("flex items-center gap-1.5 mb-1 text-xs text-muted-foreground", isMe ? "flex-row-reverse" : "flex-row")}>
                      <span className="font-medium text-foreground">{note.author_name || note.author_email}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(note.created_date), { addSuffix: true })}</span>
                    </div>

                    <div className="flex items-end gap-1">
                      {/* Delete button for own messages or admin */}
                      {(isMe || currentUser?.role === "admin") && (
                        <button
                          onClick={() => deleteNote.mutate(note.id)}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive",
                            isMe ? "order-first" : "order-last"
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-accent text-foreground rounded-tl-sm"
                      )}>
                        {note.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Compose bar */}
      <div className="border-t border-border p-3 bg-background flex gap-2 items-end">
        <Textarea
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 resize-none min-h-[40px] max-h-[120px] py-2 text-sm"
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={!draft.trim() || addNote.isPending}
          className="shrink-0 h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}