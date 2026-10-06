import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Minus, Plus, CheckCircle2, Trash2, QrCode, Banknote } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { PREMIUM_DELIVERY_CHARGE, formatPrice } from "@/lib/quickbite";
import { usePaymentEnabled, usePremiumOpen } from "@/lib/settings";
import qrAsset from "@/assets/payment-qr.jpeg.asset.json";

export function CartPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lines, setQuantity, remove, total, clear } = useCart();
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [placed, setPlaced] = useState<{ code: string } | null>(null);
  const [payment, setPayment] = useState<"qr" | "cash" | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const premiumOpen = usePremiumOpen();
  const paymentEnabled = usePaymentEnabled();
  const hasPremium = lines.some((l) => l.premium);
  const deliveryCharge = hasPremium ? PREMIUM_DELIVERY_CHARGE : 0;
  const grandTotal = total + deliveryCharge;

  const placeOrder = useMutation({
    mutationFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          table_number: table.trim(),
          total: grandTotal,
          delivery_charge: deliveryCharge,
          payment_method: paymentEnabled ? payment : null,
        })
        .select("id, code")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          menu_item_id: l.id,
          item_name: l.name,
          unit_price: l.price,
          quantity: l.quantity,
        })),
      );
      if (itemsError) throw itemsError;
      return order;
    },
    onSuccess: (order) => {
      setPlaced({ code: order.code });
      setPayment(null);
      setPaidConfirmed(false);
      clear();
    },
    onError: () => toast.error("Could not place the order. Please try again."),
  });

  const paymentReady = !paymentEnabled || payment === "cash" || (payment === "qr" && paidConfirmed);
  const canSubmit =
    lines.length > 0 && paymentReady && !(hasPremium && !premiumOpen) && name.trim().length > 1 && table.trim().length > 0;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setPlaced(null);
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{placed ? "Order confirmed" : "Your cart"}</SheetTitle>
        </SheetHeader>

        {placed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <CheckCircle2 className="size-14 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Your order ID</p>
              <p className="font-display text-4xl font-extrabold tracking-widest">{placed.code}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Status is <strong>Placed</strong>. Save this ID to track your order.
            </p>
            <Button asChild className="w-full">
              <Link to="/track" search={{ code: placed.code }}>
                Track this order
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Keep browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              {lines.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Your cart is empty. Add something tasty.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {lines.map((line) => (
                    <li key={line.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{line.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(line.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          aria-label={`Decrease ${line.name}`}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm font-bold">{line.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          aria-label={`Increase ${line.name}`}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground"
                        onClick={() => remove(line.id)}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto border-t border-border p-4">
              {hasPremium ? (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Restaurant delivery charge</span>
                  <span>{formatPrice(deliveryCharge)}</span>
                </div>
              ) : null}
              {hasPremium && !premiumOpen ? (
                <p className="text-sm text-destructive">The restaurant is closed. Remove premium items to continue.</p>
              ) : null}
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cart-name">Full name</Label>
                  <Input
                    id="cart-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ananya Sharma"
                    autoComplete="name"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cart-table">Table number</Label>
                  <Input
                    id="cart-table"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="B12"
                  />
                </div>
              </div>
              {paymentEnabled && lines.length > 0 ? (
                <div className="grid gap-2">
                  <Label>Payment</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={payment === "qr" ? "default" : "outline"}
                      onClick={() => { setPayment("qr"); setPaidConfirmed(false); }}
                    >
                      <QrCode className="size-4" /> Pay online
                    </Button>
                    <Button
                      type="button"
                      variant={payment === "cash" ? "default" : "outline"}
                      onClick={() => setPayment("cash")}
                    >
                      <Banknote className="size-4" /> Cash
                    </Button>
                  </div>
                  {payment === "qr" ? (
                    <div className="grid gap-3 rounded-sm border border-border p-3 text-center">
                      <p className="text-sm">
                        Scan and pay <strong className="text-primary">{formatPrice(grandTotal)}</strong>
                      </p>
                      <img src={qrAsset.url} alt="Payment QR code" className="mx-auto w-48 rounded-sm" />
                      <label className="flex items-center justify-center gap-2 text-sm">
                        <Checkbox checked={paidConfirmed} onCheckedChange={(v) => setPaidConfirmed(v === true)} />
                        I have paid {formatPrice(grandTotal)}
                      </label>
                    </div>
                  ) : null}
                  {payment === "cash" ? (
                    <p className="rounded-sm border border-border p-3 text-sm text-muted-foreground">
                      Please go to the food section and deposit <strong className="text-primary">{formatPrice(grandTotal)}</strong> in cash, then place your order.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                disabled={!canSubmit || placeOrder.isPending}
                onClick={() => placeOrder.mutate()}
              >
                {placeOrder.isPending ? "Placing order…" : `Place order · ${formatPrice(grandTotal)}`}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
