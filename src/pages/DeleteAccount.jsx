import { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await base44.integrations.Core.SendEmail({
      to: "support@buildertrac.app",
      subject: "Account Deletion Request",
      body: `A user has requested account deletion.\n\nEmail: ${email}\nDate: ${new Date().toISOString()}\n\nPlease delete this user's account and all associated data within 30 days.`,
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold font-display">Delete Account</h1>
          <p className="text-muted-foreground text-sm">
            Request permanent deletion of your BuilderTrac account and all associated data.
          </p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="font-semibold">Request Received</p>
            <p className="text-sm text-muted-foreground">
              We've received your deletion request for <strong>{email}</strong>. Your account and all associated data will be permanently deleted within 30 days.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-semibold mb-1">This action is permanent</p>
                <p>All your projects, tasks, documents, photos, and account data will be permanently deleted and cannot be recovered.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <Label htmlFor="email">Your account email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={loading || !email.trim()}
              >
                {loading ? "Submitting..." : "Request Account Deletion"}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Questions? Contact us at support@buildertrac.app
        </p>
      </div>
    </div>
  );
}