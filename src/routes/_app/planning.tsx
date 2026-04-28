import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtNum } from "@/lib/format";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PlanningDialog } from "@/components/dialogs/PlanningDialog";

export const Route = createFileRoute("/_app/planning")({ component: PlanningPage });

type Plan = {
  id: string; start_date: string | null; finish_date: string | null;
  estimated_output: number | null; priority_rank: number; status: string;
  machines: { id: string; name: string; code: string } | null;
  sales_orders: { so_number: string; product_name: string | null; priority: string; customers: { name: string } | null } | null;
};

function PlanningPage() {
  const { isSuper } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_plans")
        .select("id, start_date, finish_date, estimated_output, priority_rank, status, machines(id, name, code), sales_orders(so_number, product_name, priority, customers(name))")
        .order("priority_rank", { ascending: true });
      if (error) throw error;
      return data as unknown as Plan[];
    },
  });
  const machines = useQuery({
    queryKey: ["machines-active"],
    queryFn: async () => (await supabase.from("machines").select("id, code, name").eq("active", true).order("code")).data,
  });

  const grouped = new Map<string, Plan[]>();
  (plans.data ?? []).forEach(p => {
    const key = p.machines?.id ?? "_unassigned";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  });

  function openNew() { setEditId(null); setOpen(true); }
  function openEdit(id: string) { setEditId(id); setOpen(true); }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Planning Board"
        description="Jadwal produksi dikelompokkan per mesin."
        actions={isSuper ? <Button onClick={openNew}><Plus className="mr-2 size-4" />Tambah</Button> : undefined}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(machines.data ?? []).map(m => {
          const items = grouped.get(m.id) ?? [];
          return (
            <Card key={m.id} className="flex flex-col p-0 shadow-soft">
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.code}</div>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{items.length} job</span>
              </div>
              <div className="flex-1 space-y-2 p-3">
                {items.length === 0 && <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">Belum ada planning</div>}
                {items.map(p => (
                  <button
                    key={p.id}
                    onClick={() => isSuper && openEdit(p.id)}
                    className="group block w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">{p.sales_orders?.so_number}</div>
                      <span className="text-[10px] uppercase text-muted-foreground">#{p.priority_rank} · {p.status}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{p.sales_orders?.customers?.name} · {p.sales_orders?.product_name}</div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span>{fmtDate(p.start_date)} → {fmtDate(p.finish_date)}</span>
                      <span className="tabular-nums">{fmtNum(p.estimated_output)} pcs</span>
                    </div>
                    {isSuper && (
                      <div className="mt-1 flex items-center text-[11px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="mr-1 size-3" /> Edit
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <PlanningDialog open={open} onOpenChange={setOpen} planId={editId} />
    </div>
  );
}
