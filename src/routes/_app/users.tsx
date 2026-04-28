import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Info } from "lucide-react";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

type Profile = { id: string; email: string; full_name: string | null; created_at: string };
type RoleRow = { id: string; user_id: string; role: "super_user" | "production_user" | "viewer" };

function UsersPage() {
  const { isSuper, user: me } = useAuth();
  const qc = useQueryClient();

  const profiles = useQuery({
    queryKey: ["users-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
  const roles = useQuery({
    queryKey: ["users-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id, user_id, role");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: RoleRow["role"] }) => {
      // wipe roles for user, then assign single role
      const { error: e1 } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Role diperbarui");
      qc.invalidateQueries({ queryKey: ["users-roles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function roleFor(uid: string): RoleRow["role"] {
    const list = (roles.data ?? []).filter(r => r.user_id === uid).map(r => r.role);
    if (list.includes("super_user")) return "super_user";
    if (list.includes("production_user")) return "production_user";
    return "viewer";
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Users" description="Pengguna sistem dan rolenya." />

      <Card className="flex items-start gap-3 border-info/30 bg-info/5 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <div className="space-y-1 text-muted-foreground">
          <p>Sign-up ditutup. Untuk membuat user baru, tambahkan via halaman backend (Auth → Add user). Setelah user pertama login, role default-nya <strong>viewer</strong>. Super User dapat mengubah role di tabel ini.</p>
        </div>
      </Card>

      <Card className="overflow-hidden shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Dibuat</th>
              <th className="px-4 py-3 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {(profiles.data ?? []).map(p => {
              const r = roleFor(p.id);
              const isMe = p.id === me?.id;
              return (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.email} {isMe && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px]">you</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {isSuper ? (
                      <Select value={r} onValueChange={(v) => setRole.mutate({ userId: p.id, role: v as RoleRow["role"] })}>
                        <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_user">Super User</SelectItem>
                          <SelectItem value="production_user">Production User</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs capitalize">{r.replace("_", " ")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {(profiles.data ?? []).length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada user</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
