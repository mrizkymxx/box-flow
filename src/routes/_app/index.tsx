import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { SoStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { fmtNum, fmtDate, daysUntil } from "@/lib/format";
import type { SoStatus, SoPriority } from "@/lib/status";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileWarning, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

type SO = {
  id: string; so_number: string; product_name: string | null; qty_order: number; qty_produced: number;
  delivery_date: string | null; priority: SoPriority; status: SoStatus;
  customers: { name: string } | null;
};

function useDashboardData() {
  const orders = useQuery({
    queryKey: ["dash-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("id, so_number, product_name, qty_order, qty_produced, delivery_date, priority, status, customers(name)")
        .order("delivery_date", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as SO[];
    },
  });
  const logs = useQuery({
    queryKey: ["dash-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_logs")
        .select("log_date, qty_produced, qty_reject")
        .gte("log_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
      if (error) throw error;
      return data ?? [];
    },
  });
  const matShortage = useQuery({
    queryKey: ["dash-mat-short"],
    queryFn: async () => {
      const { count } = await supabase
        .from("material_status").select("*", { count: "exact", head: true })
        .in("status", ["shortage", "waiting_supplier"]);
      return count ?? 0;
    },
  });
  return { orders, logs, matShortage };
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string | number; tone: string }) {
  return (
    <Card className="flex items-center gap-4 p-5 shadow-soft">
      <div className={cn("grid size-12 place-items-center rounded-xl", tone)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { orders, logs, matShortage } = useDashboardData();
  const data = orders.data ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const activeStatuses: SoStatus[] = ["new","waiting_material","ready_plan","planned","running","partial","hold","late"];
  const totalActive = data.filter(o => activeStatuses.includes(o.status)).length;
  const totalUrgent = data.filter(o => o.priority === "urgent" && activeStatuses.includes(o.status)).length;
  const runningToday = data.filter(o => o.status === "running").length;
  const completedToday = (logs.data ?? []).filter((l: any) => l.log_date === today && l.qty_produced > 0).length;
  const lateOrders = data.filter(o => o.status === "late" || (o.delivery_date && (daysUntil(o.delivery_date) ?? 0) < 0 && o.status !== "completed")).length;

  // Daily production (14 days)
  const dailyMap = new Map<string, { date: string; produced: number; reject: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    dailyMap.set(d, { date: d.slice(5), produced: 0, reject: 0 });
  }
  (logs.data ?? []).forEach((l: any) => {
    const k = l.log_date;
    const e = dailyMap.get(k);
    if (e) { e.produced += l.qty_produced; e.reject += l.qty_reject; }
  });
  const dailyData = Array.from(dailyMap.values());

  // status pie
  const statusCounts = new Map<SoStatus, number>();
  data.forEach(o => statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1));
  const pieData = Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)","var(--chart-5)","var(--info)","var(--warning)","var(--success)","var(--destructive)"];

  // by customer top 5
  const custMap = new Map<string, number>();
  data.forEach(o => { const n = o.customers?.name ?? "Unknown"; custMap.set(n, (custMap.get(n) ?? 0) + o.qty_order); });
  const custData = Array.from(custMap.entries()).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Priority orders
  const priorityOrders = [...data]
    .filter(o => activeStatuses.includes(o.status))
    .sort((a, b) => {
      const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
      return rank[a.priority] - rank[b.priority];
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Ringkasan operasional PPIC hari ini." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={Activity} label="Order Aktif" value={fmtNum(totalActive)} tone="bg-info/15 text-info" />
        <Kpi icon={Flame} label="Order Urgent" value={fmtNum(totalUrgent)} tone="bg-destructive/15 text-destructive" />
        <Kpi icon={Activity} label="Running Today" value={fmtNum(runningToday)} tone="bg-primary/15 text-primary" />
        <Kpi icon={CheckCircle2} label="Logs Today" value={fmtNum(completedToday)} tone="bg-success/15 text-success" />
        <Kpi icon={Clock} label="Late Orders" value={fmtNum(lateOrders)} tone="bg-warning/20 text-warning-foreground dark:text-warning" />
        <Kpi icon={FileWarning} label="Material Short." value={fmtNum(matShortage.data ?? 0)} tone="bg-destructive/15 text-destructive" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Produksi Harian (14 hari)</h3>
            <span className="text-xs text-muted-foreground">qty produksi & reject</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="produced" fill="var(--chart-1)" radius={[4,4,0,0]} />
                <Bar dataKey="reject" fill="var(--chart-4)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">Status Order</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">Top Customer (qty order)</h3>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={custData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={120} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" fill="var(--chart-2)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">Trend Produksi (line)</h3>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="produced" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-soft">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h3 className="text-sm font-semibold">Priority Orders</h3>
            <p className="text-xs text-muted-foreground">Order dengan prioritas tertinggi yang masih aktif.</p>
          </div>
          <Link to="/sales-orders" className="text-xs font-medium text-primary hover:underline">View all →</Link>
        </div>
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">SO Number</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-right">Qty</th>
                <th className="px-5 py-3 text-left">Delivery</th>
                <th className="px-5 py-3 text-left">Priority</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {priorityOrders.map(o => (
                <tr key={o.id} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{o.so_number}</td>
                  <td className="px-5 py-3">{o.customers?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.product_name}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmtNum(o.qty_order)}</td>
                  <td className="px-5 py-3">{fmtDate(o.delivery_date)}</td>
                  <td className="px-5 py-3"><PriorityBadge priority={o.priority} /></td>
                  <td className="px-5 py-3"><SoStatusBadge status={o.status} /></td>
                </tr>
              ))}
              {priorityOrders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">Tidak ada order aktif</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="divide-y md:hidden">
          {priorityOrders.map(o => (
            <div key={o.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.so_number}</div>
                  <div className="text-xs text-muted-foreground">{o.customers?.name}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PriorityBadge priority={o.priority} />
                  <SoStatusBadge status={o.status} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{o.product_name}</span>
                <span className="tabular-nums font-medium">{fmtNum(o.qty_order)} pcs</span>
              </div>
              <div className="text-xs text-muted-foreground">Delivery: {fmtDate(o.delivery_date)}</div>
            </div>
          ))}
        </div>
      </Card>

      {(matShortage.data ?? 0) > 0 && (
        <Card className="flex items-start gap-3 border-warning/40 bg-warning/10 p-4">
          <AlertTriangle className="size-5 text-warning shrink-0" />
          <div className="text-sm">
            <div className="font-semibold">Material Shortage</div>
            <div className="text-muted-foreground">Ada {matShortage.data} material kurang/menunggu supplier — buka <Link to="/material" className="text-primary underline">Material Control</Link>.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
