import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, FileText, Camera, Layers, LogOut, Sun, Moon, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/portfolios", icon: Layers, label: "Portfolios" },
  { path: "/projects", icon: FolderKanban, label: "Projects" },
  { path: "/documents", icon: FileText, label: "Docs" },
  { path: "/photos", icon: Camera, label: "Photos" },
];

export default function Layout() {
  const location = useLocation();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with safe-area top inset */}
      <header
        className="sticky top-0 z-50 bg-card border-b-2 border-primary px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}
      >
        <Link to="/" className="font-display text-xl font-extrabold text-primary tracking-tight">
          BuilderTrac
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center">
                <Avatar className="w-9 h-9 border border-primary cursor-pointer">
                  <AvatarFallback className="bg-card text-primary font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => base44.auth.logout()} className="cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive cursor-pointer focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content with Framer Motion slide transitions */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav with safe-area bottom inset */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex justify-around py-2 px-2">
          {navItems.map(item => {
            const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 ${isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Delete Account confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your account and all associated data. This action cannot be undone. Please contact support if you need your data exported first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => base44.auth.logout()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete & Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}