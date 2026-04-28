import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ClipboardList, Boxes, KanbanSquare, Activity,
  FileBarChart, Database, Users, Settings, Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/sales-orders", label: "Sales Orders", icon: ClipboardList },
  { to: "/material", label: "Material Control", icon: Boxes },
  { to: "/planning", label: "Planning Board", icon: KanbanSquare },
  { to: "/production", label: "Production Progress", icon: Activity },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/master", label: "Master Data", icon: Database, superOnly: true },
  { to: "/users", label: "Users", icon: Users, superOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isSuper } = useAuth();
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Factory className="size-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold">PPIC System</span>
          <span className="text-[11px] text-muted-foreground">Production Control</span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          if (item.superOnly && !isSuper) return null;
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 text-[11px] text-muted-foreground">
        v1.0 · PPIC Karton Box
      </div>
    </aside>
  );
}
