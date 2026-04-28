import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatStatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtNum } from "@/lib/format";
import type { MatStatus } from "@/lib/status";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MaterialDialog } from "@/components/dialogs/MaterialDialog";

export const Route = createFileRoute("/_app/material")({ component: MaterialPage });

type Row = {
  id: string; material_name: string | null; need_qty: number; ready_qty: number;
  eta: string | null; status: MatStatus; note: string | null;
  sales_orders: { so_number: string; customers: { name: string } | null } | null;
};

function MaterialPage() {
  const { isSuper } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["material-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_status")
        .select("id, material_name, need_qty, ready_qty, eta, status, note, sales_orders(so_number, customers(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  function openNew() { setEditId(null); setOpen(true); }
  function openEdit(id: string) { setEditId(id); setOpen(true); }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Material Control"
        description="Status kesiapan material per Sales Order."
        actions={isSuper ? <Button onClick={openNew}><Plus className="mr-2 size-4" />Tambah</Button> : undefined}
      />
      <Card className="overflow-hidden shadow-soft">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">SO</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Material</th>
                <th className="px-4 py-3 text-right">Need</th>
                <th className="px-4 py-3 text-right">Ready</th>
                <th className="px-4 py-3 text-left">ETA</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data.map(r => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.sales_orders?.so_number}</td>
                  <td className="px-4 py-3">{r.sales_orders?.customers?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.material_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.need_qty)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.ready_qty)}</td>
                  <td className="px-4 py-3">{fmtDate(r.eta)}</td>
                  <td className="px-4 py-3"><MatStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.note}</td>
                  <td className="px-4 py-3 text-right">
                    {isSuper && <Button variant="ghost" size="sm" onClick={() => openEdit(r.id)}><Pencil className="size-4" /></Button>}
                  </td>
                </tr>
              ))}
              {!isLoading && data.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Belum ada data material</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="divide-y md:hidden">
          {data.map(r => (
            <button key={r.id} onClick={() => isSuper && openEdit(r.id)} className="w-full space-y-2 p-4 text-left hover:bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{r.sales_orders?.so_number}</div>
                  <div className="text-xs text-muted-foreground">{r.material_name}</div>
                </div>
                <MatStatusBadge status={r.status} />
              </div>
              <div className="flex justify-between text-xs">
                <span>Need: <span className="tabular-nums">{fmtNum(r.need_qty)}</span></span>
                <span>Ready: <span className="tabular-nums">{fmtNum(r.ready_qty)}</span></span>
                <span>ETA: {fmtDate(r.eta)}</span>
              </div>
              {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
            </button>
          ))}
        </div>
      </Card>
      <MaterialDialog open={open} onOpenChange={setOpen} rowId={editId} />
    </div>
  );
}
