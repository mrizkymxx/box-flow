import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "@tanstack/react-router";

export function AppShell() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-20 pt-5 md:px-8 md:pb-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
