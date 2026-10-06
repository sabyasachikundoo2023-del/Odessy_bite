import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/quickbite/SiteHeader";
import { MenuCard, type MenuItem } from "@/components/quickbite/MenuCard";
import { CartPanel } from "@/components/quickbite/CartPanel";
import { PREMIUM_CATEGORY, PREMIUM_DELIVERY_CHARGE, formatPrice } from "@/lib/quickbite";
import { usePremiumOpen } from "@/lib/settings";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium Restaurant — OdysseyBite" },
      {
        name: "description",
        content:
          "Order premium dishes from the venue restaurant at OdysseyBite. Takes more than 25 minutes · minimal delivery charge of ₹11 applies.",
      },
      { property: "og:title", content: "Premium Restaurant — OdysseyBite" },
      {
        property: "og:description",
        content: "Restaurant dishes delivered to your hackathon table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PremiumMenu,
});

function PremiumMenu() {
  const [cartOpen, setCartOpen] = useState(false);
  const premiumOpen = usePremiumOpen();

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category, image_url, is_available")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const list = (items ?? []).filter((i) => i.category === PREMIUM_CATEGORY);

  return (
    <div className="min-h-screen">
      <SiteHeader onOpenCart={() => setCartOpen(true)} />

      <section className="border-b border-border bg-secondary/40 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Back to menu
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
                <UtensilsCrossed className="size-4" /> OdysseyBite restaurant
              </p>
              <h1 className="mt-2 text-3xl font-bold uppercase leading-tight sm:text-5xl">
                Premium · <span className="text-primary">From the restaurant</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Takes more than 25 minutes · Minimal delivery charge of {formatPrice(PREMIUM_DELIVERY_CHARGE)} applies
              </p>
            </div>
            <span className={`rounded-sm border px-3 py-1.5 text-xs font-bold uppercase ${premiumOpen ? "border-success text-success" : "border-destructive text-destructive"}`}>
              {premiumOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : !premiumOpen ? (
          <p className="voyage-panel rounded-sm border border-border bg-card/40 py-16 text-center text-sm text-muted-foreground">
            The restaurant is closed right now. Please check back later.
          </p>
        ) : list.length === 0 ? (
          <p className="voyage-panel rounded-sm border border-border bg-card/40 py-16 text-center text-sm text-muted-foreground">
            The restaurant menu is being prepared. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <MenuCard key={item.id} item={item} premium />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        OdysseyBite · <Link to="/admin" className="underline hover:text-primary">Venue staff login</Link>
      </footer>

      <CartPanel open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
