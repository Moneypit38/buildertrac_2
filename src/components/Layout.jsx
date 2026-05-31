import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, FileText, Camera, Layers, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b-2 border-primary px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-extrabold text-primary tracking-tight">
          BuildTrac
        </Link>
        <div className="flex items-center gap-3">
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
              <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary">
        <div className="max-w-lg mx-auto flex justify-around py-2 px-2 pb-4">
          {navItems.map(item => {
            const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 ${isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}