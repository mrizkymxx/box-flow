import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export type MasterTable = "customers" | "products" | "machines" | "materials";

type FieldDef = { key: string; label: string; type?: "text" | "number" };

const FIELDS: Record<MasterTable, FieldDef[]> = {
  customers: [
    { key: "code", label: "Code *" }, { key: "name", label: "Name *" },
    { key: "contact_person", label: "Contact" }, { key: "phone", label: "Phone" },
    { key: "email", label: "Email" }, { key: "address", label: "Address" },
  ],
  products: [
    { key: "code", label: "Code *" }, { key: "name", label: "Name *" },
    { key: "box_type", label: "Box Type" }, { key: "paper_material", label: "Paper" },
    { key: "specification", label: "Specification" },
  ],
  machines: [
    { key: "code", label: "Code *" }, { key: "name", label: "Name *" },
    { key: "type", label: "Type" }, { key: "capacity_per_hour", label: "Cap/Hour", type: "number" },
  ],
  materials: [
    { key: "code", label: "Code *" }, { key: "name", label: "Name *" },
    { key: "unit", label: "Unit" },
  ],
};

export function MasterDialog({
  open, onOpenChange, table, row,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  table: MasterTable;
  row: any | null;
}) {
  const qc = useQueryClient();
  const { isSuper } = useAuth();
  const [form, setForm] = useState<any>({ active: true });

  useEffect(() => {
    if (!open) return;
    setForm(row ? { ...row } : { active: true });
  }, [open, row]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { active: form.active ?? true };
      for (const f of FIELDS[table]) {
        const v = form[f.key];
        payload[f.key] = f.type === "number" ? Number(v) || 0 : (v ?? null);
      }
      if (row?.id) {
        const { error } = await supabase.from(table).update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Tersimpan"); qc.invalidateQueries({ queryKey: ["master", table] }); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => { if (row?.id) { const { error } = await supabase.from(table).delete().eq("id", row.id); if (error) throw error; } },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["master", table] }); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuper) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Read-only</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Hanya Super User yang dapat mengubah master data.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{row ? "Edit" : "Tambah"} {table}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS[table].map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch checked={!!form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          {row?.id && <Button variant="destructive" onClick={() => { if (confirm("Hapus?")) del.mutate(); }}><Trash2 className="mr-2 size-4" />Hapus</Button>}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
