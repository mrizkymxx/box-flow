import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/master")({ component: MasterPage });

function useTable<T>(name: "customers" | "products" | "machines" | "materials") {
  return useQuery<T[]>({
    queryKey: ["master", name],
    queryFn: async () => {
      const { data, error } = await supabase.from(name).select("*").order("code");
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

function Table({ rows, cols }: { rows: any[]; cols: { key: string; label: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>{cols.map(c => <th key={c.key} className="px-4 py-3 text-left">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-muted/30">
              {cols.map(c => <td key={c.key} className="px-4 py-3">{String(r[c.key] ?? "—")}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={cols.length} className="p-6 text-center text-muted-foreground">Belum ada data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MasterPage() {
  const customers = useTable<any>("customers");
  const products = useTable<any>("products");
  const machines = useTable<any>("machines");
  const materials = useTable<any>("materials");
  return (
    <div className="space-y-5">
      <PageHeader title="Master Data" description="Data referensi: customer, produk, mesin, material." />
      <Card className="p-4 shadow-soft">
        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="machines">Machines</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>
          <TabsContent value="customers" className="mt-4">
            <Table rows={customers.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"contact_person",label:"Contact"},{key:"phone",label:"Phone"},{key:"email",label:"Email"}]} />
          </TabsContent>
          <TabsContent value="products" className="mt-4">
            <Table rows={products.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"box_type",label:"Box Type"},{key:"paper_material",label:"Paper"},{key:"specification",label:"Spec"}]} />
          </TabsContent>
          <TabsContent value="machines" className="mt-4">
            <Table rows={machines.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"type",label:"Type"},{key:"capacity_per_hour",label:"Cap/Hour"}]} />
          </TabsContent>
          <TabsContent value="materials" className="mt-4">
            <Table rows={materials.data ?? []} cols={[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"unit",label:"Unit"}]} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
