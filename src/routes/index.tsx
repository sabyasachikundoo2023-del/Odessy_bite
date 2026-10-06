import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Clock, UtensilsCrossed, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/quickbite/SiteHeader";
import { MenuCard, type MenuItem } from "@/components/quickbite/MenuCard";
import { CartPanel } from "@/components/quickbite/CartPanel";
import { CATEGORIES, PREMIUM_CATEGORY, PREMIUM_DELIVERY_CHARGE, formatPrice } from "@/lib/quickbite";
import { usePremiumOpen } from "@/lib/settings";
import heroImage from "@/assets/odyssey-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OdysseyBite — Order food to your table" },
      {
        name: "description",
        content:
          "Browse meals, snacks, beverages and late-night essentials and get them delivered to your hackathon table. No sign-up needed.",
      },
      { property: "og:title", content: "OdysseyBite — Order food to your table" },
      {
        property: "og:description",
        content: "Meals, snacks and coffee delivered to your seat at the hackathon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Menu,
});

function Menu() {
  const [cartOpen, setCartOpen] = useState(false);

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

  const premiumOpen = usePremiumOpen();

  return (
    <div className="min-h-screen">
      <SiteHeader onOpenCart={() => setCartOpen(true)} />

      <section className="relative min-h-[460px] overflow-hidden border-b border-border sm:min-h-[540px]">
        <img src={heroImage} alt="A voyage across the sea toward a golden city" width={1920} height={1080} className="absolute inset-0 size-full object-cover object-[64%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        <div className="relative mx-auto flex min-h-[460px] max-w-6xl items-center px-4 py-16 sm:min-h-[540px]">
          <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            HackOdyssey venue provisions
          </p>
          <h1 className="mt-4 text-4xl font-bold uppercase leading-tight text-foreground sm:text-6xl">
            Fuel your <span className="text-primary">odyssey.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            Keep building while provisions journey to your table. No accounts, no detours—just choose your fare and continue the quest.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="size-4" /> Open provisions
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-background/30 backdrop-blur-sm">
              <Link to="/track">
                <Clock className="size-4" /> Track my order
              </Link>
            </Button>
          </div>
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
        ) : (
          <>
            <section className="voyage-panel mb-16 rounded-sm border border-primary/50 bg-card/40 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase text-primary">Premium · Order from the restaurant</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Takes more than 25 minutes · Minimal delivery charge of {formatPrice(PREMIUM_DELIVERY_CHARGE)} applies
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-sm border px-2 py-1 text-xs font-bold uppercase ${premiumOpen ? "border-success text-success" : "border-destructive text-destructive"}`}>
                    {premiumOpen ? "Open" : "Closed"}
                  </span>
                  <Button asChild size="lg">
                    <Link to="/premium">
                      <UtensilsCrossed className="size-4" /> Explore the restaurant <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
            {CATEGORIES.map((category) => {
              const list = (items ?? []).filter((i) => i.category === category);
              if (category === PREMIUM_CATEGORY) return null;
              if (list.length === 0) return null;
              return (
                <section key={category} className="mb-16">
                  <div className="mb-6 flex items-end justify-between border-b border-border pb-3">
                    <h2 className="text-2xl font-bold uppercase text-primary">{category}</h2>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {list.length} item{list.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item) => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        OdysseyBite · <Link to="/admin" className="underline hover:text-primary">Venue staff login</Link>
      </footer>

      <CartPanel open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
