import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/quickbite";

export const Route = createFileRoute("/admin/summary")({
  head: () => ({
    meta: [
      { title: "Sales summary — OdysseyBite Staff" },
      { name: "description", content: "Review OdysseyBite venue sales and popular items." },
      { property: "og:title", content: "Sales summary — OdysseyBite Staff" },
      { property: "og:description", content: "Review OdysseyBite venue sales and popular items." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSummary,
});

function AdminSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: async () => {
      const [ordersRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("id, total, status"),
        supabase.from("order_items").select("item_name, quantity"),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const orders = ordersRes.data ?? [];
      const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const counts = new Map<string, number>();
      for (const item of itemsRes.data ?? []) {
        counts.set(item.item_name, (counts.get(item.item_name) ?? 0) + item.quantity);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

      return {
        totalOrders: orders.length,
        delivered: orders.filter((o) => o.status === "Delivered").length,
        revenue,
        averageOrder: orders.length > 0 ? revenue / orders.length : 0,
        top,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Sales summary</h1>
        <p className="text-sm text-muted-foreground">Everything ordered at the venue so far.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total orders" value={String(data.totalOrders)} />
        <Stat label="Delivered" value={String(data.delivered)} />
        <Stat label="Total revenue" value={formatPrice(data.revenue)} />
        <Stat label="Average order" value={formatPrice(data.averageOrder)} />
      </div>

       <section className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold">Most ordered items</h2>
        {data.top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No items ordered yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.top.map(([name, qty]) => {
              const max = data.top[0]?.[1] ?? 1;
              return (
                <li key={name}>
                  <div className="flex justify-between text-sm font-medium">
                    <span>{name}</span>
                    <span className="text-muted-foreground">{qty} sold</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.round((qty / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
     <div className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
    </div>
  );
}
