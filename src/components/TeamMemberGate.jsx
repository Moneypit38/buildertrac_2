import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HardHat, Lock } from "lucide-react";

/**
 * Wraps any action button/trigger. If the current user is a team member (not the app owner / admin
 * who paid), clicking shows an upgrade prompt instead of performing the action.
 *
 * Usage:
 *   <TeamMemberGate action="create projects">
 *     <Button onClick={...}>New Project</Button>
 *   </TeamMemberGate>
 */
export default function TeamMemberGate({ children, action = "use this feature" }) {
  const [showPrompt, setShowPrompt] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // Admins (paying owners) pass through freely
  const isTeamMember = user?.role === "user";

  if (!isTeamMember) return children;

  const handleCheckout = () => {
    if (window.self !== window.top) {
      alert("Purchasing is only available from the published app. Visit buildertrac.base44.app to purchase.");
      return;
    }
    window.location.href = "https://buildertrac.base44.app";
  };

  return (
    <>
      {/* Clone child and intercept its click */}
      <span
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShowPrompt(true); }}
        className="contents"
      >
        {children}
      </span>

      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <HardHat className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-xl font-extrabold">
              Builder<span style={{ color: "#F5A623" }}>T</span>rac Pro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>To {action}, you'll need a full account.</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Get unlimited projects, portfolios, documents, and team management for a one-time purchase of <strong className="text-foreground">$9.99</strong>.
            </p>
            <Button className="w-full font-semibold" onClick={handleCheckout}>
              Get BuilderTrac — $9.99
            </Button>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              Maybe later
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}