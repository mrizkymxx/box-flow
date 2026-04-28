import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { fmtDate, fmtNum } from "@/lib/format";
import { SoStatusBadge } from "@/components/StatusBadge";
import type { SoStatus } from "@/lib/status";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

type Row = {
  so_number: string; product_name: string | null; qty_order: number; qty_produced: number;
  qty_reject: number; delivery_date: string | null; status: SoStatus;
  customers: { name: string } | null;
};

function exportCsv(rows: Row[]) {
  const head = ["SO Number","Customer","Product","Qty Order","Qty Produced","Qty Reject","Delivery","Status"];
  const body = rows.map(r => [
    r.so_number, r.customers?.name ?? "", r.product_name ?? "",
    r.qty_order, r.qty_produced, r.qty_reject, r.delivery_date ?? "", r.status,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [head.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ppic-orders-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast.success("CSV diunduh");
}

function ReportsPage() {
  const { data = [] } = useQuery({
    queryKey: ["report-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("so_number, product_name, qty_order, qty_produced, qty_reject, delivery_date, status, customers(name)")
        .order("delivery_date", { ascending: true });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Laporan order, produksi, dan completion rate."
        actions={<Button onClick={() => exportCsv(data)}><Download className="mr-2 size-4" />Export CSV</Button>}
      />
      <Card className="overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">SO</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Order</th>
                <th className="px-4 py-3 text-right">Produced</th>
                <th className="px-4 py-3 text-right">Reject</th>
                <th className="px-4 py-3 text-left">Delivery</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.so_number}</td>
                  <td className="px-4 py-3">{r.customers?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.product_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.qty_order)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.qty_produced)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.qty_reject)}</td>
                  <td className="px-4 py-3">{fmtDate(r.delivery_date)}</td>
                  <td className="px-4 py-3"><SoStatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
