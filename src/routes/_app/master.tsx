import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MasterDialog, type MasterTable } from "@/components/dialogs/MasterDialog";

export const Route = createFileRoute("/_app/master")({ component: MasterPage });

function useTable<T>(name: MasterTable) {
  return useQuery<T[]>({
    queryKey: ["master", name],
    queryFn: async () => {
      const { data, error } = await supabase.from(name).select("*").order("code");
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

function DataTable({
  rows, cols, onEdit, isSuper,
}: {
  rows: any[]; cols: { key: string; label: string }[];
  onEdit: (r: any) => void; isSuper: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {cols.map(c => <th key={c.key} className="px-4 py-3 text-left">{c.label}</th>)}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-muted/30">
              {cols.map(c => <td key={c.key} className="px-4 py-3">{String(r[c.key] ?? "—")}</td>)}
              <td className="px-4 py-3 text-right">
                {isSuper && <Button variant="ghost" size="sm" onClick={() => onEdit(r)}><Pencil className="size-4" /></Button>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={cols.length + 1} className="p-6 text-center text-muted-foreground">Belum ada data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MasterPage() {
  const { isSuper } = useAuth();
  const customers = useTable<any>("customers");
  const products = useTable<any>("products");
  const machines = useTable<any>("machines");
  const materials = useTable<any>("materials");
  const [tab, setTab] = useState<MasterTable>("customers");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setOpen(true); }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Data"
        description="Data referensi: customer, produk, mesin, material."
        actions={isSuper ? <Button onClick={openNew}><Plus className="mr-2 size-4" />Tambah</Button> : undefined}
      />
      <Card className="p-4 shadow-soft">
        <Tabs value={tab} onValueChange={(v) => setTab(v as MasterTable)}>
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="machines">Machines</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>
          <TabsContent value="customers" className="mt-4">
            <DataTable isSuper={isSuper} onEdit={openEdit} rows={customers.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"contact_person",label:"Contact"},{key:"phone",label:"Phone"},{key:"email",label:"Email"}]} />
          </TabsContent>
          <TabsContent value="products" className="mt-4">
            <DataTable isSuper={isSuper} onEdit={openEdit} rows={products.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"box_type",label:"Box Type"},{key:"paper_material",label:"Paper"},{key:"specification",label:"Spec"}]} />
          </TabsContent>
          <TabsContent value="machines" className="mt-4">
            <DataTable isSuper={isSuper} onEdit={openEdit} rows={machines.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"type",label:"Type"},{key:"capacity_per_hour",label:"Cap/Hour"}]} />
          </TabsContent>
          <TabsContent value="materials" className="mt-4">
            <DataTable isSuper={isSuper} onEdit={openEdit} rows={materials.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"unit",label:"Unit"}]} />
          </TabsContent>
        </Tabs>
      </Card>
      <MasterDialog open={open} onOpenChange={setOpen} table={tab} row={editing} />
    </div>
  );
}
