import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { MatStatus } from "@/lib/status";
import { useAuth } from "@/lib/auth-context";

type Form = {
  id?: string;
  sales_order_id: string;
  material_name: string;
  need_qty: number;
  ready_qty: number;
  eta: string;
  status: MatStatus;
  note: string;
};
const EMPTY: Form = { sales_order_id: "", material_name: "", need_qty: 0, ready_qty: 0, eta: "", status: "shortage", note: "" };

export function MaterialDialog({
  open, onOpenChange, rowId,
}: { open: boolean; onOpenChange: (v: boolean) => void; rowId: string | null }) {
  const qc = useQueryClient();
  const { isSuper } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);

  const sos = useQuery({
    queryKey: ["lookup-so-min"],
    queryFn: async () => (await supabase.from("sales_orders").select("id, so_number").order("so_number")).data ?? [],
  });
  const existing = useQuery({
    enabled: open && !!rowId,
    queryKey: ["mat-detail", rowId],
    queryFn: async () => (await supabase.from("material_status").select("*").eq("id", rowId!).single()).data,
  });

  useEffect(() => {
    if (!open) return;
    if (rowId && existing.data) {
      const d = existing.data as any;
      setForm({
        id: d.id, sales_order_id: d.sales_order_id, material_name: d.material_name ?? "",
        need_qty: d.need_qty, ready_qty: d.ready_qty, eta: d.eta ?? "", status: d.status, note: d.note ?? "",
      });
    } else if (!rowId) setForm(EMPTY);
  }, [open, rowId, existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        sales_order_id: form.sales_order_id, material_name: form.material_name || null,
        need_qty: form.need_qty, ready_qty: form.ready_qty, eta: form.eta || null,
        status: form.status, note: form.note || null,
      };
      if (form.id) {
        const { error } = await supabase.from("material_status").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("material_status").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Tersimpan"); qc.invalidateQueries({ queryKey: ["material-status"] }); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => { if (form.id) { const { error } = await supabase.from("material_status").delete().eq("id", form.id); if (error) throw error; } },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["material-status"] }); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuper) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Read-only</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Hanya Super User yang dapat mengubah material status.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{rowId ? "Edit Material" : "Tambah Material"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Sales Order *</Label>
            <Select value={form.sales_order_id} onValueChange={(v) => setForm({ ...form, sales_order_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih SO" /></SelectTrigger>
              <SelectContent>{(sos.data ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.so_number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Material Name</Label>
            <Input value={form.material_name} onChange={e => setForm({ ...form, material_name: e.target.value })} />
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Need Qty</Label><Input type="number" value={form.need_qty} onChange={e => setForm({ ...form, need_qty: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Ready Qty</Label><Input type="number" value={form.ready_qty} onChange={e => setForm({ ...form, ready_qty: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">ETA</Label><Input type="date" value={form.eta} onChange={e => setForm({ ...form, eta: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MatStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["ready","partial","shortage","waiting_supplier"] as MatStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Note</Label><Textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          {form.id && <Button variant="destructive" onClick={() => { if (confirm("Hapus?")) del.mutate(); }}><Trash2 className="mr-2 size-4" />Hapus</Button>}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => save.mutate()} disabled={!form.sales_order_id || save.isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
