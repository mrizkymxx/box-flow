import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user, role, signOut } = useAuth();
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Preferensi tampilan dan akun." />
      <Card className="space-y-4 p-5 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold">Tampilan</h3>
          <p className="text-xs text-muted-foreground">Switch antara mode terang dan gelap.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">Toggle theme</span>
        </div>
      </Card>
      <Card className="space-y-3 p-5 shadow-soft">
        <h3 className="text-sm font-semibold">Akun</h3>
        <div className="text-sm"><span className="text-muted-foreground">Email: </span>{user?.email}</div>
        <div className="text-sm"><span className="text-muted-foreground">Role: </span>{role}</div>
        <Button variant="outline" onClick={() => signOut()}><LogOut className="mr-2 size-4" /> Sign out</Button>
      </Card>
    </div>
  );
}
