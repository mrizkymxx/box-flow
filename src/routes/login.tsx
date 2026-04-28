import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) toast.error(error);
    else {
      toast.success("Selamat datang!");
      navigate({ to: "/" });
    }
  }

  return (
    <div className="grid min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/40 lg:grid-cols-2">
      <div className="hidden flex-col justify-between p-12 text-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
            <Factory className="size-6" />
          </div>
          <div>
            <div className="text-lg font-bold">PPIC System</div>
            <div className="text-xs text-muted-foreground">Production Planning & Control</div>
          </div>
        </div>
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">Kontrol penuh produksi karton box dari Sales Order hingga selesai.</h1>
          <p className="text-muted-foreground">Sistem operasional internal yang fleksibel, cepat, dan modern. Dashboard rinci, planning board interaktif, progress real-time, serta laporan lengkap.</p>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {["Dashboard real-time","Planning board","Material control","Progress mobile","Notes timeline","Reports lengkap"].map(x => (
              <li key={x} className="flex items-center gap-2 rounded-md bg-card/60 px-3 py-2 shadow-soft"><span className="size-1.5 rounded-full bg-primary"/>{x}</li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">© PPIC Karton Box · v1.0</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-7 shadow-card">
          <div className="mb-6 lg:hidden flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Factory className="size-5" /></div>
            <span className="font-bold">PPIC System</span>
          </div>
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Akses sistem PPIC dengan akun yang diberikan administrator.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.co.id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign in
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Belum punya akun? Hubungi Super User untuk dibuatkan.
          </p>
        </Card>
      </div>
    </div>
  );
}
