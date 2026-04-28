import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

type Row = { user_id: string; role: string; profiles: { email: string; full_name: string | null; created_at: string } | null };

function UsersPage() {
  const { data = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, profiles(email, full_name, created_at)");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });
  return (
    <div className="space-y-5">
      <PageHeader title="Users" description="Pengguna sistem dan rolenya." />
      <Card className="overflow-hidden shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={`${r.user_id}-${r.role}`} className="border-t">
                <td className="px-4 py-3 font-medium">{r.profiles?.email ?? r.user_id}</td>
                <td className="px-4 py-3">{r.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3"><span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{r.role}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{r.profiles?.created_at ? fmtDateTime(r.profiles.created_at) : "—"}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada user. Gunakan menu backend untuk membuat akun pertama (Super User).</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground">Pembuatan user baru dapat dilakukan via backend dashboard. Setelah user dibuat, ubah rolenya menjadi <code>super_user</code> atau <code>production_user</code> di tabel <code>user_roles</code> melalui Lovable Cloud.</p>
    </div>
  );
}
