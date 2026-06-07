import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CheckCircle2, Zap } from "lucide-react";

export default function SubscriptionGate({ portfolio, children }) {
  const [status, setStatus] = useState(null); // null=loading, true=active, false=inactive
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    if (!portfolio?.id) return;
    try {
      const res = await base44.functions.invoke("getSubscriptionStatus", { portfolioId: portfolio.id });
      setStatus(res.data.isActive);
    } catch {
      setStatus(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [portfolio?.id]);

  // Check for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success" && params.get("portfolioId") === portfolio?.id) {
      // Clean URL and recheck
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(checkStatus, 2000); // give Stripe a moment
    }
  }, [portfolio?.id]);

  const handleSubscribe = async () => {
    // Block if in iframe (preview mode)
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not the preview.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
      });
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) {
      alert("Could not start checkout: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === null) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === true) return children;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-sm space-y-5">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Activate "{portfolio?.name}"</h2>
          <p className="text-sm text-muted-foreground">Subscribe to unlock all projects, team members, documents, and more for this portfolio.</p>
        </div>

        <div className="bg-accent/50 rounded-xl p-4 text-left space-y-2">
          {[
            "Unlimited projects",
            "Unlimited team members & clients",
            "Documents, photos & appointments",
            "AI task generation",
            "Task reminders & notifications",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-3xl font-bold">$49<span className="text-base font-normal text-muted-foreground">/month</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">Per portfolio · Cancel anytime</p>
        </div>

        <Button className="w-full" size="lg" onClick={handleSubscribe} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          {loading ? "Redirecting..." : "Subscribe Now"}
        </Button>
      </div>
    </div>
  );
}