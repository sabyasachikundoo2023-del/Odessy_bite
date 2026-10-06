import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES, formatPrice, statusIndex, type OrderStatus } from "@/lib/quickbite";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Live orders — OdysseyBite Staff" },
      { name: "description", content: "Manage live OdysseyBite venue orders." },
      { property: "og:title", content: "Live orders — OdysseyBite Staff" },
      { property: "og:description", content: "Manage live OdysseyBite venue orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOrders,
});

type AdminOrder = {
  id: string;
  code: string;
  customer_name: string;
  table_number: string;
  status: string;
  total: number;
  delivery_charge: number;
  payment_method: string | null;
  created_at: string;
  order_items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

function AdminOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, code, customer_name, table_number, status, total, delivery_charge, payment_method, created_at, order_items(id, item_name, quantity, unit_price)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminOrder[];
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Could not update that order."),
  });

  const active = (orders ?? []).filter((o) => o.status !== "Delivered");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Live orders</h1>
        <p className="text-sm text-muted-foreground">
          {active.length} in progress · updates in real time
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (orders ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No orders yet. They'll appear here the moment someone checks out.
        </p>
      ) : (
        <div className="grid gap-4">
          {(orders ?? []).map((order) => (
            <article
              key={order.id}
               className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-extrabold tracking-widest">
                    {order.code}
                  </p>
                  <p className="text-sm font-semibold">
                    {order.customer_name} · Table {order.table_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                  {Number(order.delivery_charge) > 0 ? (<p className="text-xs text-muted-foreground">incl. {formatPrice(order.delivery_charge)} delivery</p>) : null}
                  {order.payment_method ? (
                    <p className="text-xs font-semibold text-primary">
                      {order.payment_method === "qr" ? "Paid online (QR)" : "Cash at food section"}
                    </p>
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {order.status}
                  </p>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="rounded-lg bg-muted px-2.5 py-1">
                    {item.item_name} × {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => {
                  const isCurrent = order.status === status;
                  const isDone = statusIndex(order.status) > statusIndex(status);
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={isCurrent ? "default" : isDone ? "secondary" : "outline"}
                      disabled={isCurrent || updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: order.id, status })}
                    >
                      {status}
                    </Button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
