import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Form = {
  id?: string;
  sales_order_id: string;
  machine_id: string;
  start_date: string;
  finish_date: string;
  estimated_output: number;
  priority_rank: number;
  status: "scheduled" | "running" | "completed" | "hold";
  note: string;
};
const EMPTY: Form = { sales_order_id: "", machine_id: "", start_date: "", finish_date: "", estimated_output: 0, priority_rank: 1, status: "scheduled", note: "" };

export function PlanningDialog({
  open, onOpenChange, planId,
}: { open: boolean; onOpenChange: (v: boolean) => void; planId: string | null }) {
  const qc = useQueryClient();
  const { isSuper } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);

  const sos = useQuery({
    queryKey: ["lookup-so-min"],
    queryFn: async () => (await supabase.from("sales_orders").select("id, so_number").order("so_number")).data ?? [],
  });
  const machines = useQuery({
    queryKey: ["lookup-machines"],
    queryFn: async () => (await supabase.from("machines").select("id, code, name").eq("active", true).order("code")).data ?? [],
  });
  const existing = useQuery({
    enabled: open && !!planId,
    queryKey: ["plan-detail", planId],
    queryFn: async () => (await supabase.from("production_plans").select("*").eq("id", planId!).single()).data,
  });

  useEffect(() => {
    if (!open) return;
    if (planId && existing.data) {
      const d = existing.data as any;
      setForm({
        id: d.id, sales_order_id: d.sales_order_id, machine_id: d.machine_id ?? "",
        start_date: d.start_date ?? "", finish_date: d.finish_date ?? "",
        estimated_output: d.estimated_output ?? 0, priority_rank: d.priority_rank ?? 1,
        status: d.status, note: d.note ?? "",
      });
    } else if (!planId) setForm(EMPTY);
  }, [open, planId, existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        sales_order_id: form.sales_order_id, machine_id: form.machine_id || null,
        start_date: form.start_date || null, finish_date: form.finish_date || null,
        estimated_output: form.estimated_output, priority_rank: form.priority_rank,
        status: form.status, note: form.note || null,
      };
      if (form.id) {
        const { error } = await supabase.from("production_plans").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("production_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Tersimpan"); qc.invalidateQueries({ queryKey: ["plans"] }); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => { if (form.id) { const { error } = await supabase.from("production_plans").delete().eq("id", form.id); if (error) throw error; } },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["plans"] }); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuper) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Read-only</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Hanya Super User yang dapat mengubah planning.</p>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{planId ? "Edit Planning" : "Tambah Planning"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Sales Order *</Label>
            <Select value={form.sales_order_id} onValueChange={(v) => setForm({ ...form, sales_order_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih SO" /></SelectTrigger>
              <SelectContent>{(sos.data ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.so_number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Machine</Label>
            <Select value={form.machine_id} onValueChange={(v) => setForm({ ...form, machine_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih mesin" /></SelectTrigger>
              <SelectContent>{(machines.data ?? []).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Start</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Finish</Label><Input type="date" value={form.finish_date} onChange={e => setForm({ ...form, finish_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Est. Output</Label><Input type="number" value={form.estimated_output} onChange={e => setForm({ ...form, estimated_output: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Priority Rank</Label><Input type="number" value={form.priority_rank} onChange={e => setForm({ ...form, priority_rank: Number(e.target.value) })} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Form["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["scheduled","running","completed","hold"] as const).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
