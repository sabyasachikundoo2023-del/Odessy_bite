import { Link } from "@tanstack/react-router";
import { Compass, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export function SiteHeader({ onOpenCart }: { onOpenCart?: () => void }) {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-2 px-4 py-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full border border-primary/60 text-primary">
            <Compass className="size-5" />
          </span>
          <span className="font-display text-lg font-bold uppercase text-primary sm:text-xl">OdysseyBite</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 text-xs font-semibold uppercase sm:flex">
          <Link
            to="/"
            className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            activeProps={{ className: "rounded-sm px-3 py-2 bg-secondary text-primary" }}
            activeOptions={{ exact: true }}
          >
            Menu
          </Link>
          <Link
            to="/premium"
            className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            activeProps={{ className: "rounded-sm px-3 py-2 bg-secondary text-primary" }}
          >
            Premium
          </Link>
          <Link
            to="/track"
            className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            activeProps={{ className: "rounded-sm px-3 py-2 bg-secondary text-primary" }}
          >
            Track order
          </Link>

          <Link
            to="/admin"
            className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            Staff
          </Link>
        </nav>

        {onOpenCart ? (
          <Button onClick={onOpenCart} className="relative gap-2">
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-bold text-background">
                {count}
              </span>
            ) : null}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
