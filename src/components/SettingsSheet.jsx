import { useState } from "react";
import { Settings, LogOut, Trash2, Sun, Moon, Database, AlertTriangle, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsSheet({ user }) {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearAllData = async () => {
    setClearing(true);
    try {
      await Promise.all([
        base44.entities.Task.deleteMany({}),
        base44.entities.Project.deleteMany({}),
        base44.entities.Portfolio.deleteMany({}),
        base44.entities.Document.deleteMany({}),
        base44.entities.SitePhoto.deleteMany({}),
        base44.entities.Appointment.deleteMany({}),
        base44.entities.Note.deleteMany({}),
        base44.entities.Contact.deleteMany({}),
        base44.entities.PortfolioMember.deleteMany({}),
        base44.entities.ProjectMember.deleteMany({}),
      ]);
      queryClient.invalidateQueries();
      setShowClearDataDialog(false);
      setOpen(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <SheetHeader className="mb-6">
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>

          {/* User info */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium">{user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <div className="space-y-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-accent transition-colors min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="border-t border-border my-3" />

            {/* Clear all data */}
            <button
              onClick={() => setShowClearDataDialog(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-accent transition-colors min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-orange-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Clear All Data</p>
                  <p className="text-xs text-muted-foreground">Remove all projects, tasks & photos</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="border-t border-border my-3" />

            {/* Sign out */}
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors min-h-[52px]"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteAccountDialog(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors min-h-[52px]"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Delete Account</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear Data confirmation */}
      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your portfolios, projects, tasks, documents, photos, appointments, and notes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              disabled={clearing}
              className="bg-orange-500 hover:bg-orange-600 text-white min-h-[44px]"
            >
              {clearing ? "Clearing..." : "Clear All Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account confirmation */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your account and all associated data. This action cannot be undone. You will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (typeof base44.auth.deleteAccount === "function") {
                    await base44.auth.deleteAccount();
                  }
                } finally {
                  base44.auth.logout();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
            >
              Delete & Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}