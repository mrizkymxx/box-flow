import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/format";
import type { SoStatus, SoPriority } from "@/lib/status";
import { SO_STATUS_LABEL } from "@/lib/status";
import { Trash2, Send, MessageSquare } from "lucide-react";

type SOForm = {
  id?: string;
  so_number: string;
  customer_po: string;
  customer_id: string | null;
  product_id: string | null;
  product_name: string;
  box_type: string;
  paper_material: string;
  specification: string;
  qty_order: number;
  delivery_date: string;
  priority: SoPriority;
  status: SoStatus;
  note: string;
};

const EMPTY: SOForm = {
  so_number: "", customer_po: "", customer_id: null, product_id: null, product_name: "",
  box_type: "", paper_material: "", specification: "", qty_order: 0, delivery_date: "",
  priority: "normal", status: "new", note: "",
};

export function SalesOrderDialog({
  open, onOpenChange, soId,
}: { open: boolean; onOpenChange: (v: boolean) => void; soId: string | null }) {
  const qc = useQueryClient();
  const { user, isSuper, canWriteProduction } = useAuth();
  const [form, setForm] = useState<SOForm>(EMPTY);
  const [tab, setTab] = useState("detail");

  const customers = useQuery({
    queryKey: ["lookup-customers"],
    queryFn: async () => (await supabase.from("customers").select("id, name, code").eq("active", true).order("name")).data ?? [],
  });
  const products = useQuery({
    queryKey: ["lookup-products"],
    queryFn: async () => (await supabase.from("products").select("id, name, code, box_type, paper_material, specification").eq("active", true).order("name")).data ?? [],
  });

  const existing = useQuery({
    enabled: open && !!soId,
    queryKey: ["so-detail", soId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders").select("*").eq("id", soId!).single();
      if (error) throw error;
      return data;
    },
  });

  const notes = useQuery({
    enabled: open && !!soId,
    queryKey: ["so-notes", soId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notes").select("*").eq("sales_order_id", soId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) return;
    if (soId && existing.data) {
      const d = existing.data as any;
      setForm({
        id: d.id, so_number: d.so_number ?? "", customer_po: d.customer_po ?? "",
        customer_id: d.customer_id, product_id: d.product_id, product_name: d.product_name ?? "",
        box_type: d.box_type ?? "", paper_material: d.paper_material ?? "", specification: d.specification ?? "",
        qty_order: d.qty_order ?? 0, delivery_date: d.delivery_date ?? "",
        priority: d.priority, status: d.status, note: d.note ?? "",
      });
    } else if (!soId) {
      setForm({ ...EMPTY, so_number: "SO-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 9000 + 1000) });
      setTab("detail");
    }
  }, [open, soId, existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        so_number: form.so_number.trim(),
        customer_po: form.customer_po || null,
        customer_id: form.customer_id,
        product_id: form.product_id,
        product_name: form.product_name || null,
        box_type: form.box_type || null,
        paper_material: form.paper_material || null,
        specification: form.specification || null,
        qty_order: Number(form.qty_order) || 0,
        delivery_date: form.delivery_date || null,
        priority: form.priority,
        status: form.status,
        note: form.note || null,
      };
      if (form.id) {
        const { error } = await supabase.from("sales_orders").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sales_orders").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "SO diperbarui" : "SO dibuat");
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["dash-orders"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!form.id) return;
      const { error } = await supabase.from("sales_orders").delete().eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SO dihapus");
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["dash-orders"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const productOpts = useMemo(() => products.data ?? [], [products.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{soId ? "Edit Sales Order" : "Tambah Sales Order"}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="notes" disabled={!soId}>Notes ({notes.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="SO Number *">
                <Input value={form.so_number} onChange={e => setForm({ ...form, so_number: e.target.value })} />
              </Field>
              <Field label="Customer PO">
                <Input value={form.customer_po} onChange={e => setForm({ ...form, customer_po: e.target.value })} />
              </Field>
              <Field label="Customer">
                <Select value={form.customer_id ?? ""} onValueChange={(v) => setForm({ ...form, customer_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Pilih customer" /></SelectTrigger>
                  <SelectContent>
                    {(customers.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Product">
                <Select
                  value={form.product_id ?? ""}
                  onValueChange={(v) => {
                    const p = productOpts.find((x: any) => x.id === v);
                    setForm({
                      ...form,
                      product_id: v || null,
                      product_name: p?.name ?? form.product_name,
                      box_type: p?.box_type ?? form.box_type,
                      paper_material: p?.paper_material ?? form.paper_material,
                      specification: p?.specification ?? form.specification,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih product" /></SelectTrigger>
                  <SelectContent>
                    {productOpts.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Box Type"><Input value={form.box_type} onChange={e => setForm({ ...form, box_type: e.target.value })} /></Field>
              <Field label="Paper Material"><Input value={form.paper_material} onChange={e => setForm({ ...form, paper_material: e.target.value })} /></Field>
              <Field label="Specification" className="sm:col-span-2"><Input value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })} /></Field>
              <Field label="Qty Order *"><Input type="number" value={form.qty_order} onChange={e => setForm({ ...form, qty_order: Number(e.target.value) })} /></Field>
              <Field label="Delivery Date"><Input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></Field>
              <Field label="Priority">
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as SoPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low","normal","high","urgent"] as SoPriority[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SoStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SO_STATUS_LABEL) as SoStatus[]).map(s => <SelectItem key={s} value={s}>{SO_STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Note" className="sm:col-span-2"><Textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            {soId && <NoteComposer soId={soId} onAdded={() => qc.invalidateQueries({ queryKey: ["so-notes", soId] })} />}
            <div className="mt-4 space-y-3">
              {(notes.data ?? []).length === 0 && <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">Belum ada catatan</div>}
              {(notes.data ?? []).map((n: any) => (
                <div key={n.id} className="rounded-lg border bg-card p-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="rounded bg-secondary px-2 py-0.5 capitalize">{n.kind}</span>
                    <span className="text-muted-foreground">{n.author_name ?? "—"} · {fmtDateTime(n.created_at)}</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-2">
          {form.id && isSuper && (
            <Button variant="destructive" onClick={() => { if (confirm("Hapus SO ini?")) del.mutate(); }} disabled={del.isPending}>
              <Trash2 className="mr-2 size-4" />Hapus
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          {isSuper && (
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.so_number || !form.qty_order}>
              {save.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          )}
        </DialogFooter>
        {!isSuper && !canWriteProduction && (
          <p className="text-xs text-muted-foreground">Mode read-only. Hanya Super User yang dapat mengubah SO.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"space-y-1.5 " + className}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function NoteComposer({ soId, onAdded }: { soId: string; onAdded: () => void }) {
  const { user, canWriteProduction } = useAuth();
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("general");
  const [busy, setBusy] = useState(false);

  if (!canWriteProduction) {
    return <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">Hanya production user/super yang dapat menambah catatan.</div>;
  }
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["general","order","material","planning","production","completion"].map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Textarea rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder="Tulis catatan…" />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!body.trim() || busy}
          onClick={async () => {
            if (!user) return;
            setBusy(true);
            const { error } = await supabase.from("notes").insert({
              sales_order_id: soId, body: body.trim(), kind: kind as any,
              author_id: user.id, author_name: user.email,
            });
            setBusy(false);
            if (error) toast.error(error.message);
            else { setBody(""); onAdded(); toast.success("Catatan ditambahkan"); }
          }}
        >
          <Send className="mr-2 size-4" />Kirim
        </Button>
      </div>
    </div>
  );
}
