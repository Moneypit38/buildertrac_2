import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const HOST = "mybuildertrac.base44.app";

const makeToken = () => {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

// Private calendar link: add it once to Google or Apple Calendar and tasks with due dates
// and appointments show up there and keep updating.
export default function CalendarSyncDialog({ open, onClose }) {
  const [feed, setFeed] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || feed) return;
    (async () => {
      try {
        const rows = await base44.entities.CalendarFeed.list();
        setFeed(rows[0] || (await base44.entities.CalendarFeed.create({ token: makeToken() })));
      } catch (e) {
        toast.error("Couldn't set up your calendar link");
      }
    })();
  }, [open, feed]);

  const httpsUrl = feed ? `https://${HOST}/functions/calendarFeed?token=${feed.token}` : "";

  const copy = async () => {
    try { await navigator.clipboard.writeText(httpsUrl); toast.success("Link copied"); }
    catch { toast.error("Couldn't copy. Press and hold the link to copy it."); }
  };

  const reset = async () => {
    if (!feed) return;
    setBusy(true);
    try {
      await base44.entities.CalendarFeed.delete(feed.id);
      setFeed(await base44.entities.CalendarFeed.create({ token: makeToken() }));
      toast.success("New link made. The old link no longer works.");
    } catch { toast.error("Couldn't reset the link"); }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscribe your phone's calendar</DialogTitle>
          <DialogDescription>
            Your tasks with due dates and your appointments show up in your phone's calendar as a calendar called "BuilderTrac" and update on their own. It's one-way: changes made in BuilderTrac show up there.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button className="w-full h-11 justify-start gap-2" disabled={!feed} onClick={copy}>
            <Copy className="w-4 h-4" /> 1. Copy your calendar link
          </Button>
          <div className="rounded-lg border border-border p-3 text-sm space-y-1">
            <p className="font-semibold">2. iPhone (Apple Calendar)</p>
            <ol className="list-decimal pl-5 text-muted-foreground space-y-0.5">
              <li>Open Settings, then Calendar, then Accounts</li>
              <li>Add Account, then Other, then Add Subscribed Calendar</li>
              <li>Paste the link in the Server box</li>
              <li>Tap Next, then Save</li>
            </ol>
          </div>
          <div className="rounded-lg border border-border p-3 text-sm space-y-1">
            <p className="font-semibold">Google Calendar</p>
            <p className="text-muted-foreground">The Google app can't add a link, so use a computer: open calendar.google.com, click + next to "Other calendars", choose "From URL", and paste the link. It then shows in the Google Calendar app too.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Apple updates about hourly. Google can take several hours. Tasks with no due date, and finished tasks, are left out.
        </p>
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">This link is private. Anyone who has it can see your tasks and appointments. If it gets shared, make a new one.</p>
          <Button variant="ghost" className="h-11 gap-2 text-destructive" disabled={!feed || busy} onClick={reset}>
            <RefreshCw className="w-4 h-4" /> Make a new link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
