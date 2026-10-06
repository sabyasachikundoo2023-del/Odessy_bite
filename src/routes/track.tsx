import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/quickbite/SiteHeader";
import { ORDER_STATUSES, formatPrice, statusIndex } from "@/lib/quickbite";

const searchSchema = z.object({ code: z.coerce.string().optional() });

export const Route = createFileRoute("/track")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Track my order — OdysseyBite" },
      {
        name: "description",
        content:
          "Check your OdysseyBite order status with your order ID or your name and table number.",
      },
      { property: "og:title", content: "Track my order — OdysseyBite" },
      {
        property: "og:description",
        content: "Placed, preparing, out for delivery or delivered — see where your food is.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

type TrackedOrder = {
  id: string;
  code: string;
  customer_name: string;
  table_number: string;
  status: string;
  total: number;
  delivery_charge: number;
  created_at: string;
  order_items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

function TrackPage() {
  const { code: initialCode } = Route.useSearch();
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const lookup = async (by: "code" | "details") => {
    setLoading(true);
    setMessage(null);
    let query = supabase
      .from("orders")
      .select(
        "id, code, customer_name, table_number, status, total, delivery_charge, created_at, order_items(id, item_name, quantity, unit_price)",
      )
      .order("created_at", { ascending: false });

    query =
      by === "code"
        ? query.eq("code", code.trim().toUpperCase())
        : query.ilike("customer_name", name.trim()).eq("table_number", table.trim());

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setMessage("Something went wrong. Please try again.");
      return;
    }
    setOrders((data ?? []) as TrackedOrder[]);
    if (!data || data.length === 0) setMessage("No order found with those details.");
  };

  useEffect(() => {
    if (initialCode) void lookup("code");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
         <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Follow the voyage</p>
         <h1 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">Track my order</h1>
        <p className="mt-2 text-muted-foreground">
          Use your order ID, or the name and table number you ordered with.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <form
             className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup("code");
            }}
          >
            <h2 className="text-lg font-bold">By order ID</h2>
            <div className="mt-3 grid gap-1.5">
              <Label htmlFor="code">Order ID</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="A1B2C3"
                className="uppercase tracking-widest"
              />
            </div>
            <Button className="mt-4 w-full" type="submit" disabled={loading || !code.trim()}>
              <Search className="size-4" /> Find order
            </Button>
          </form>

          <form
             className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup("details");
            }}
          >
            <h2 className="text-lg font-bold">By name &amp; table</h2>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="t-name">Full name</Label>
                <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="t-table">Table number</Label>
                <Input id="t-table" value={table} onChange={(e) => setTable(e.target.value)} />
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              type="submit"
              disabled={loading || !name.trim() || !table.trim()}
            >
              <Search className="size-4" /> Find orders
            </Button>
          </form>
        </div>

        {message ? <p className="mt-6 text-sm text-muted-foreground">{message}</p> : null}

        <div className="mt-8 space-y-5">
          {(orders ?? []).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const current = statusIndex(order.status);

  return (
     <article className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Order ID</p>
          <p className="font-display text-2xl font-extrabold tracking-widest">{order.code}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            {order.customer_name} · Table {order.table_number}
          </p>
          <p>{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-4">
        {ORDER_STATUSES.map((status, i) => (
          <li
            key={status}
             className={`rounded-sm border px-3 py-2 text-center text-sm font-semibold ${
              i <= current
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            {status}
          </li>
        ))}
      </ol>

      <ul className="mt-5 divide-y divide-border text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>
              {item.item_name} × {item.quantity}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(Number(item.unit_price) * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {Number(order.delivery_charge) > 0 ? (
        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
          <span>Restaurant delivery charge</span>
          <span>{formatPrice(order.delivery_charge)}</span>
        </div>
      ) : null}
      <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
        <span>Total</span>
        <span className="text-primary">{formatPrice(order.total)}</span>
      </div>
    </article>
  );
}
