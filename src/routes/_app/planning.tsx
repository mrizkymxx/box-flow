import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { fmtDate, fmtNum } from "@/lib/format";
import { GripVertical } from "lucide-react";

export const Route = createFileRoute("/_app/planning")({ component: PlanningPage });

type Plan = {
  id: string; start_date: string | null; finish_date: string | null;
  estimated_output: number | null; priority_rank: number; status: string;
  machines: { id: string; name: string; code: string } | null;
  sales_orders: { so_number: string; product_name: string | null; priority: string; customers: { name: string } | null } | null;
};

function PlanningPage() {
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
    queryFn: async () => {
      const { data, error } = await supabase.from("machines").select("id, code, name").eq("active", true).order("code");
      if (error) throw error;
      return data;
    },
  });

  const grouped = new Map<string, Plan[]>();
  (plans.data ?? []).forEach(p => {
    const key = p.machines?.id ?? "_unassigned";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Planning Board" description="Jadwal produksi dikelompokkan per mesin." />
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
                  <div key={p.id} className="group flex items-start gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
                    <GripVertical className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{p.sales_orders?.so_number}</div>
                        <span className="text-[10px] uppercase text-muted-foreground">#{p.priority_rank}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{p.sales_orders?.customers?.name} · {p.sales_orders?.product_name}</div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span>{fmtDate(p.start_date)} → {fmtDate(p.finish_date)}</span>
                        <span className="tabular-nums">{fmtNum(p.estimated_output)} pcs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Drag-and-drop untuk re-prioritize akan ditambahkan di iterasi berikut. Saat ini menampilkan view-only board per mesin.</p>
    </div>
  );
}
