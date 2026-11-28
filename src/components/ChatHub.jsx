import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Users, Send, Flag, Loader2, Lock, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";
import { callChat, markSeen, isUnread, playChime } from "@/lib/chat";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const ROLE = { owner: "Owner", project_manager: "Project manager", team_member: "Team member" };

function Dot() {
  return <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 ring-2 ring-background animate-pulse shrink-0" aria-label="New messages" />;
}

// ---- The owner's alerts: flagged conversations (no message text) and reported messages ----
function FlagsPanel({ onChange }) {
  const [flags, setFlags] = useState(null);
  const load = useCallback(async () => {
    try {
      const rows = await base44.entities.ChatFlag.filter({ resolved: false }, "-created_date", 50);
      setFlags(rows);
      onChange?.(rows.length);
    } catch { setFlags([]); }
  }, [onChange]);
  useEffect(() => { load(); }, [load]);
  if (!flags || flags.length === 0) return null;

  const resolve = async (f) => { await base44.entities.ChatFlag.update(f.id, { resolved: true }); load(); };
  const turnOff = async (f) => {
    if (!String(f.sender_id || "").startsWith("link:")) return toast.error("This person has an account, not a link.");
    if (!window.confirm(`Turn off ${f.sender_name || "this person"}'s access to your jobs?`)) return;
    try {
      await base44.entities.ShareLink.update(String(f.sender_id).slice(5), { active: false });
      await base44.entities.ChatFlag.update(f.id, { resolved: true });
      toast.success("Access turned off");
      load();
    } catch { toast.error("Couldn't turn that off. Try Share access on the portfolio."); }
  };

  return (
    <div className="bg-orange-500/10 border border-orange-400/50 rounded-xl p-3 space-y-2">
      <p className="text-sm font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-orange-400" /> {flags.length} chat alert{flags.length !== 1 ? "s" : ""}</p>
      <p className="text-[11px] text-muted-foreground">Alerts don't include message text, so private messages stay private. A message only shows here if the person who received it reported it.</p>
      {flags.map((f) => (
        <div key={f.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
          <p className="text-sm">
            <span className="font-semibold">{f.sender_name || "Someone"}</span>
            {f.source === "report"
              ? <> was reported{f.reporter_name ? ` by ${f.reporter_name}` : ""}</>
              : <> sent a message flagged for <span className="font-semibold">{f.category}</span></>}
            {f.thread_kind === "dm" ? (f.recipient_name ? ` to ${f.recipient_name} (direct message)` : " (direct message)") : f.room ? ` in the ${f.room} team chat` : " in a team chat"}.
          </p>
          {f.reported_text && <p className="text-sm bg-background border border-border rounded-md p-2 whitespace-pre-wrap break-words">{f.reported_text}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => resolve(f)}>Mark reviewed</Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => turnOff(f)}>Turn off access</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- A single conversation ----
function Thread({ token, me, target, onBack }) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastIdRef = useRef(null);
  const key = target.kind === "team" ? `team|${target.room}` : `dm|${target.with}`;
  const params = target.kind === "team" ? { kind: "team", room: target.room } : { kind: "dm", with: target.with };

  const load = useCallback(async () => {
    try {
      const r = await callChat(token, "messages", params);
      if (r?.messages) {
        setMessages((prev) => (prev && prev.length === r.messages.length && prev[prev.length - 1]?.id === r.messages[r.messages.length - 1]?.id ? prev : r.messages));
        const last = r.messages[r.messages.length - 1];
        if (last && lastIdRef.current && last.id !== lastIdRef.current && !last.mine) playChime();
        if (last) lastIdRef.current = last.id;
        markSeen(me.id, key, last?.created_date);
        qc.invalidateQueries({ queryKey: ["chatBadge"] }); // clears the Home alert right away
      }
    } catch { /* keep what we have */ }
  }, [token, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const r = await callChat(token, "send", { ...params, content });
      if (r?.error) throw new Error(r.error);
      setDraft("");
      await load();
    } catch { toast.error("Couldn't send. Please try again."); }
    setSending(false);
  };

  const report = async (m) => {
    if (!window.confirm("Report this message? The account owner will be able to read it.")) return;
    try {
      const r = await callChat(token, "report", { message_id: m.id });
      if (r?.error) throw new Error(r.error);
      toast.success("Reported. Thank you.");
    } catch { toast.error("Couldn't send the report."); }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ height: "68vh", minHeight: 420 }}>
      <div className="flex items-center gap-2 px-2 py-1 border-b border-border">
        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={onBack}><ChevronLeft className="w-4 h-4" /> Back</Button>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{target.title}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            {target.kind === "dm" ? <><Lock className="w-3 h-3" /> Private. Only you two can read this.</> : "Everyone on this team"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages === null ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No messages yet. Say hello.</p>
        ) : messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
            <p className="text-[11px] text-muted-foreground mb-0.5">{m.mine ? "You" : m.sender_name} · {new Date(m.created_date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            <div className="flex items-center gap-1 max-w-[88%]">
              <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${m.mine ? "bg-primary text-primary-foreground rounded-tr-sm order-1" : "bg-accent text-foreground rounded-tl-sm"}`}>{m.content}</div>
              {!m.mine && (
                <button type="button" aria-label="Report message" onClick={() => report(m)} className="inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-xl text-muted-foreground/60 hover:text-destructive active:bg-accent">
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-2 flex items-end gap-2">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder="Message…" className="min-h-[44px] max-h-32 resize-none text-sm" />
        <Button size="icon" onClick={send} disabled={!draft.trim() || sending} aria-label="Send">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ---- Main chat screen: team chats + direct messages ----
export default function ChatHub({ token = null, isOwner = false, openDm = null }) {
  const [who, setWho] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [target, setTarget] = useState(null);
  const [error, setError] = useState(false);
  const [multi, setMulti] = useState(false);
  const [picked, setPicked] = useState([]);
  const [multiText, setMultiText] = useState("");
  const [multiSending, setMultiSending] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await callChat(token, "who");
        if (!off) setWho(r);
      } catch { if (!off) setError(true); }
    })();
    return () => { off = true; };
  }, [token]);

  // Opened from the Home alert: go straight into that conversation (once).
  const openedRef = useRef(false);
  useEffect(() => {
    if (!openDm || openedRef.current || !who?.allowed) return;
    openedRef.current = true;
    const p = (who.people || []).find((x) => x.id === openDm.withId);
    if (p) setTarget({ kind: "dm", with: p.id, title: p.name });
  }, [openDm, who]);

  const loadInbox = useCallback(async () => {
    try {
      const r = await callChat(token, "inbox");
      if (r?.threads) setInbox(r.threads);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!who?.allowed || target) return;
    loadInbox();
    const t = setInterval(loadInbox, 15000);
    return () => clearInterval(t);
  }, [who, target, loadInbox]);

  if (error) return <p className="text-sm text-muted-foreground text-center py-10">Chat couldn't load. Please try again.</p>;
  if (!who) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!who.allowed) return <p className="text-sm text-muted-foreground text-center py-10">Chat is available to team members and project managers.</p>;

  if (target) return <Thread token={token} me={who.me} target={target} onBack={() => { setTarget(null); loadInbox(); }} />;

  const unread = (key) => isUnread(who.me.id, inbox.find((t) => t.key === key));

  const togglePick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const sendMany = async () => {
    const content = multiText.trim();
    if (!content || picked.length === 0 || multiSending) return;
    setMultiSending(true);
    try {
      const r = await callChat(token, "send", { kind: "dm_many", with_many: picked, content });
      if (r?.error) throw new Error(r.error);
      toast.success(`Sent to ${r.sent} ${r.sent === 1 ? "person" : "people"}`);
      setMulti(false); setPicked([]); setMultiText("");
    } catch { toast.error("Couldn't send. Please try again."); }
    setMultiSending(false);
  };

  return (
    <div className="space-y-5">
      {isOwner && <FlagsPanel />}

      <section className="space-y-2">
        <h2 className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Team chat</h2>
        {who.rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team chats yet. They appear once you have a portfolio.</p>
        ) : who.rooms.map((room) => (
          <button key={room} onClick={() => setTarget({ kind: "team", room, title: `${room} team` })}
            className="w-full text-left bg-card border border-border rounded-xl px-4 min-h-[56px] flex items-center gap-3 hover:border-primary/50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-primary" /></div>
            <span className="flex-1 font-semibold text-sm truncate">{room}</span>
            {unread(`team|${room}`) && <Dot />}
          </button>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Lock className="w-4 h-4" /> Direct messages</h2>
          {who.people.length > 1 && (
            <Button size="sm" variant={multi ? "default" : "outline"} onClick={() => { setMulti((v) => !v); setPicked([]); }}>
              {multi ? "Cancel" : "Message several"}
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          {multi ? "Pick the people to message. Each one gets it as their own private message." : "Private between two people. Nobody else can read them, including the account owner."}
        </p>
        {who.people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one to message yet. Team members show up here once they're invited.</p>
        ) : who.people.map((p) => (
          <button key={p.id} onClick={() => (multi ? togglePick(p.id) : setTarget({ kind: "dm", with: p.id, title: p.name }))}
            className="w-full text-left bg-card border border-border rounded-xl px-4 min-h-[56px] flex items-center gap-3 hover:border-primary/50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold shrink-0">{(p.name || "?")[0].toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <p className="text-[11px] text-muted-foreground">{ROLE[p.role] || "Team"}</p>
            </div>
            {multi
              ? <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${picked.includes(p.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{picked.includes(p.id) && <Check className="w-4 h-4" />}</span>
              : unread(`dm|${p.id}`) && <Dot />}
          </button>
        ))}
        {multi && (
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <Textarea value={multiText} onChange={(e) => setMultiText(e.target.value)} rows={2} placeholder="Type your message…" className="text-sm" />
            <Button className="w-full" disabled={!multiText.trim() || picked.length === 0 || multiSending} onClick={sendMany}>
              {multiSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {picked.length === 0 ? "Pick at least one person" : `Send to ${picked.length} ${picked.length === 1 ? "person" : "people"}`}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
