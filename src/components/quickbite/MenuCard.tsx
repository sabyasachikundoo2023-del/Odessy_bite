import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice, itemImage } from "@/lib/quickbite";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};

export function MenuCard({ item, premium = false }: { item: MenuItem; premium?: boolean }) {
  const { add } = useCart();

  return (
    <article className="group voyage-panel overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={itemImage(item)}
          alt={item.name}
          loading="lazy"
          width={944}
          height={704}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!item.is_available ? (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-sm font-semibold text-background">
            Out of stock
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight">{item.name}</h3>
          <span className="shrink-0 font-bold text-primary">{formatPrice(item.price)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <Button
          className="mt-2 w-full"
          disabled={!item.is_available}
          onClick={() => {
            add({ id: item.id, name: item.name, price: Number(item.price), premium });
            toast.success(`${item.name} added to cart`);
          }}
        >
          <Plus className="size-4" /> Add to cart
        </Button>
      </div>
    </article>
  );
}
