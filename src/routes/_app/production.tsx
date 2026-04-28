import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SoStatusBadge } from "@/components/StatusBadge";
import { fmtNum, fmtDate } from "@/lib/format";
import type { SoStatus } from "@/lib/status";
import { useAuth } from "@/lib/auth-context";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/production")({ component: ProductionPage });

type Row = {
  id: string; so_number: string; product_name: string | null;
  qty_order: number; qty_produced: number; qty_reject: number;
  status: SoStatus; customers: { name: string } | null;
};

function ProductionPage() {
  const { canWriteProduction, user } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["prod-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("id, so_number, product_name, qty_order, qty_produced, qty_reject, status, customers(name)")
        .in("status", ["planned","running","partial","ready_plan","late"])
        .order("delivery_date", { ascending: true });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const machines = useQuery({
    queryKey: ["machines-all"],
    queryFn: async () => (await supabase.from("machines").select("id, code, name").eq("active", true)).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [selectedSo, setSelectedSo] = useState<Row | null>(null);
  const [machineId, setMachineId] = useState<string>("");
  const [shift, setShift] = useState<"shift_1" | "shift_2" | "shift_3">("shift_1");
  const [qtyProd, setQtyProd] = useState("");
  const [qtyReject, setQtyReject] = useState("0");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function openLog(r: Row) {
    setSelectedSo(r); setMachineId(""); setShift("shift_1"); setQtyProd(""); setQtyReject("0"); setNote("");
    setOpen(true);
  }

  async function submitLog() {
    if (!selectedSo || !user) return;
    const prod = parseInt(qtyProd, 10);
    if (!prod || prod <= 0) { toast.error("Qty produksi tidak valid"); return; }
    setSaving(true);
    const { error } = await supabase.from("production_logs").insert({
      sales_order_id: selectedSo.id,
      machine_id: machineId || null,
      shift,
      qty_produced: prod,
      qty_reject: parseInt(qtyReject || "0", 10),
      status: "running",
      note: note || null,
      created_by: user.id,
    });
    if (!error && note) {
      await supabase.from("notes").insert({
        sales_order_id: selectedSo.id, kind: "production", body: note,
        author_id: user.id, author_name: user.email,
      });
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Production log tersimpan");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["prod-orders"] });
    qc.invalidateQueries({ queryKey: ["dash-orders"] });
    qc.invalidateQueries({ queryKey: ["dash-logs"] });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Production Progress" description="Input hasil produksi cepat dari mesin." />
      <Card className="overflow-hidden shadow-soft">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && <div className="col-span-full p-6 text-center text-sm text-muted-foreground">Loading…</div>}
          {data.map(r => {
            const balance = Math.max(0, r.qty_order - r.qty_produced);
            const pct = r.qty_order > 0 ? Math.min(100, Math.round((r.qty_produced / r.qty_order) * 100)) : 0;
            return (
              <Card key={r.id} className="flex flex-col gap-3 p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.so_number}</div>
                    <div className="text-xs text-muted-foreground">{r.customers?.name}</div>
                  </div>
                  <SoStatusBadge status={r.status} />
                </div>
                <div className="text-xs text-muted-foreground">{r.product_name}</div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span className="tabular-nums">{fmtNum(r.qty_produced)} / {fmtNum(r.qty_order)} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Reject: <span className="tabular-nums">{fmtNum(r.qty_reject)}</span></span>
                  <span>Balance: <span className="tabular-nums">{fmtNum(balance)}</span></span>
                </div>
                {canWriteProduction && (
                  <Button size="sm" onClick={() => openLog(r)} className="w-full"><Plus className="mr-1 size-4" /> Input Hasil</Button>
                )}
              </Card>
            );
          })}
          {!isLoading && data.length === 0 && <div className="col-span-full p-6 text-center text-sm text-muted-foreground">Tidak ada order yang sedang aktif untuk diproduksi.</div>}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Hasil Produksi · {selectedSo?.so_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mesin</Label>
                <Select value={machineId} onValueChange={setMachineId}>
                  <SelectTrigger><SelectValue placeholder="Pilih mesin" /></SelectTrigger>
                  <SelectContent>
                    {(machines.data ?? []).map(m => <SelectItem key={m.id} value={m.id}>{m.code} · {m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shift</Label>
                <Select value={shift} onValueChange={(v) => setShift(v as typeof shift)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift_1">Shift 1</SelectItem>
                    <SelectItem value="shift_2">Shift 2</SelectItem>
                    <SelectItem value="shift_3">Shift 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Qty Produced</Label>
                <Input type="number" inputMode="numeric" value={qtyProd} onChange={(e) => setQtyProd(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Qty Reject</Label>
                <Input type="number" inputMode="numeric" value={qtyReject} onChange={(e) => setQtyReject(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)…" />
            </div>
            {selectedSo && (
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                Target: {fmtNum(selectedSo.qty_order)} · Sudah: {fmtNum(selectedSo.qty_produced)} · Sisa: {fmtNum(selectedSo.qty_order - selectedSo.qty_produced)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submitLog} disabled={saving}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">Status SO (partial/completed) dan total qty diperbarui otomatis saat log disimpan. Tanggal mengikuti hari ini.</p>
    </div>
  );
}
