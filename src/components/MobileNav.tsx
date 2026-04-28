import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, KanbanSquare, Activity, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const ITEMS: Item[] = [
  { to: "/", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/sales-orders", label: "Orders", icon: ClipboardList },
  { to: "/planning", label: "Plan", icon: KanbanSquare },
  { to: "/production", label: "Produce", icon: Activity },
  { to: "/material", label: "Mat", icon: Boxes },
];

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur md:hidden">
      {ITEMS.map((it) => {
        const active = it.exact ? path === it.to : path.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to as string}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <it.icon className="size-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
