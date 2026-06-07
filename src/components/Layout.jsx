import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, FileText, Camera, Layers, LogOut, Sun, Moon, Trash2, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { markViewed, getLastViewed } from "../hooks/useLastViewed";
import { ViewedContext, isNewItem, getSeenPhotoIds } from "../lib/viewedContext";
import SubscriptionGate from "./SubscriptionGate";

// Tab page components — rendered persistently to preserve state
import Dashboard from "../pages/Dashboard";
import Portfolios from "../pages/Portfolios";
import Projects from "../pages/Projects";
import Documents from "../pages/Documents";
import Photos from "../pages/Photos";

// Map nav paths to their "last viewed" section keys
const NAV_SECTION_KEYS = {
  "/documents": "docs",
  "/photos": "photos",
};

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Home", Component: Dashboard },
  { path: "/portfolios", icon: Layers, label: "Portfolios", Component: Portfolios },
  { path: "/projects", icon: FolderKanban, label: "Projects", Component: Projects },
  { path: "/documents", icon: FileText, label: "Docs", Component: Documents },
  { path: "/photos", icon: Camera, label: "Photos", Component: Photos },
];

function isTabPath(pathname) {
  return navItems.some(n =>
    n.path === "/" ? pathname === "/" : pathname === n.path || pathname.startsWith(n.path + "/")
  );
}

function getActiveTab(pathname) {
  if (pathname === "/") return "/";
  const match = navItems.find(n => n.path !== "/" && (pathname === n.path || pathname.startsWith(n.path + "/")));
  return match?.path || "/";
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lastViewedTimes, setLastViewedTimes] = useState({
    docs: getLastViewed("docs"),
    photos: getLastViewed("photos"),
  });

  const onTab = isTabPath(location.pathname);
  const activeTab = getActiveTab(location.pathname);
  const isChildRoute = !onTab;

  // Lazy-mount tabs: only mount a tab once it's been visited, then keep it alive
  const [mountedTabs, setMountedTabs] = useState(() => new Set([activeTab]));
  useEffect(() => {
    setMountedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Fetch data needed for nav badge counts
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list(), staleTime: 60000 });
  const { data: photos = [] } = useQuery({ queryKey: ["photos"], queryFn: () => base44.entities.SitePhoto.list(), staleTime: 60000 });

  // Mark section as viewed whenever the active tab changes OR on first mount
  useEffect(() => {
    const sectionKey = NAV_SECTION_KEYS[activeTab];
    if (sectionKey) {
      markViewed(sectionKey);
      const newTs = getLastViewed(sectionKey);
      setLastViewedTimes(prev => ({ ...prev, [sectionKey]: newTs }));
      if (sectionKey === "photos") window.dispatchEvent(new Event("photos-seen-updated"));
      if (sectionKey === "docs") window.dispatchEvent(new Event("docs-seen-updated"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, onTab]); // onTab included so navigating back to a tab from a child route also triggers

  // Badge counts per nav path
  const seenPhotoIds = getSeenPhotoIds();
  const navBadges = {
    "/documents": docs.filter(d => isNewItem(d.created_date, lastViewedTimes.docs)).length,
    "/photos": photos.filter(ph => {
      const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000);
      return new Date(ph.created_date) > cutoff72h && !seenPhotoIds.has(ph.id);
    }).length,
  };

  return (
    <ViewedContext.Provider value={lastViewedTimes}>
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header with safe-area top inset */}
      <header
        className="sticky top-0 z-50 bg-card border-b-2 border-primary px-4 flex items-center justify-between"
        style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))`, paddingBottom: "0.75rem" }}
      >
        {/* Brand or Back button */}
        {isChildRoute ? (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-primary font-semibold min-h-[44px] min-w-[44px] -ml-1 px-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        ) : (
          <Link to="/" className="font-display text-xl font-extrabold text-foreground tracking-tight min-h-[44px] flex items-center">
            Builder<span style={{color: "#F5A623"}}>T</span>rac
          </Link>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="min-h-[44px] min-w-[44px] flex items-center justify-center">
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
              <DropdownMenuItem
                onClick={() => base44.auth.logout()}
                className="cursor-pointer min-h-[44px]"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive cursor-pointer focus:text-destructive min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
        <SubscriptionGate>
          {/* Tab pages — lazily mounted on first visit, then kept alive (hidden) */}
          {navItems.map(({ path, Component }) => (
            mountedTabs.has(path) ? (
              <div key={path} className={onTab && activeTab === path ? "block" : "hidden"}>
                <Component />
              </div>
            ) : null
          ))}

          {/* Child routes (e.g. /project/:id) — slide in over tabs */}
          {isChildRoute && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}
        </SubscriptionGate>
      </main>

      {/* Bottom nav with safe-area bottom inset */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex justify-around px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            const badgeCount = navBadges[path] || 0;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-4 min-h-[44px] py-2 rounded-xl transition-all duration-200 relative ${isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                <motion.span
                  className="relative"
                  animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className="w-5 h-5" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-300 ring-2 ring-background animate-pulse" />
                  )}
                </motion.span>
                <span className="text-[11px] font-medium">{label}</span>
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
              This will permanently remove your account and all associated data. This action cannot be undone. You will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  // Attempt SDK deletion if available
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
    </div>
    </ViewedContext.Provider>
  );
}