import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SoStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { fmtNum, fmtDate } from "@/lib/format";
import type { SoStatus, SoPriority } from "@/lib/status";
import { Search, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/sales-orders")({ component: SalesOrdersPage });

type Row = {
  id: string; so_number: string; customer_po: string | null; product_name: string | null;
  qty_order: number; qty_produced: number; delivery_date: string | null;
  priority: SoPriority; status: SoStatus;
  customers: { name: string } | null;
};

function SalesOrdersPage() {
  const { isSuper } = useAuth();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("id, so_number, customer_po, product_name, qty_order, qty_produced, delivery_date, priority, status, customers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = data.filter(r =>
    !q || r.so_number.toLowerCase().includes(q.toLowerCase()) ||
    r.customers?.name.toLowerCase().includes(q.toLowerCase()) ||
    r.product_name?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales Orders"
        description="Daftar seluruh sales order dan progresnya."
        actions={isSuper ? <Button><Plus className="mr-2 size-4" />Tambah SO</Button> : undefined}
      />
      <Card className="p-4 shadow-soft">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari SO/customer/produk…" className="pl-9" />
        </div>
      </Card>
      <Card className="overflow-hidden shadow-soft">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">SO Number</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Qty Order</th>
                <th className="px-4 py-3 text-right">Produced</th>
                <th className="px-4 py-3 text-left">Delivery</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.so_number}</td>
                  <td className="px-4 py-3">{r.customers?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.product_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.qty_order)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.qty_produced)}</td>
                  <td className="px-4 py-3">{fmtDate(r.delivery_date)}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3"><SoStatusBadge status={r.status} /></td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="divide-y md:hidden">
          {filtered.map(r => (
            <div key={r.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{r.so_number}</div>
                  <div className="text-xs text-muted-foreground">{r.customers?.name}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PriorityBadge priority={r.priority} />
                  <SoStatusBadge status={r.status} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{r.product_name}</div>
              <div className="flex justify-between text-xs">
                <span>Delivery: {fmtDate(r.delivery_date)}</span>
                <span className="tabular-nums">{fmtNum(r.qty_produced)} / {fmtNum(r.qty_order)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">Tip: form tambah/edit SO + import Excel + duplicate akan ditambahkan pada iterasi berikutnya. Lihat detail SO via <Link to="/planning" className="text-primary underline">Planning</Link>.</p>
    </div>
  );
}
