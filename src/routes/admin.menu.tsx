import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, formatPrice, itemImage, type Category } from "@/lib/quickbite";
import { PREMIUM_OPEN_KEY, premiumOpenQuery, PAYMENT_ENABLED_KEY, paymentEnabledQuery } from "@/lib/settings";

export const Route = createFileRoute("/admin/menu")({
  head: () => ({
    meta: [
      { title: "Menu management — OdysseyBite Staff" },
      { name: "description", content: "Manage OdysseyBite food, drink and essentials availability." },
      { property: "og:title", content: "Menu management — OdysseyBite Staff" },
      { property: "og:description", content: "Manage OdysseyBite menu availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminMenu,
});

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: Category;
  image_url: string;
  is_available: boolean;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  category: "Meals",
  image_url: "",
  is_available: true,
};

function AdminMenu() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category, image_url, is_available")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const { data: premiumOpenData } = useQuery(premiumOpenQuery);
  const premiumOpen = premiumOpenData ?? true;
  const togglePremium = useMutation({
    mutationFn: async (open: boolean) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: PREMIUM_OPEN_KEY, bool_value: open, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: (_d, open) => {
      toast.success(open ? "Restaurant section opened" : "Restaurant section closed");
      void queryClient.invalidateQueries({ queryKey: premiumOpenQuery.queryKey });
    },
    onError: () => toast.error("Could not update the restaurant section."),
  });

  const { data: paymentEnabledData } = useQuery(paymentEnabledQuery);
  const paymentEnabled = paymentEnabledData ?? true;
  const togglePayment = useMutation({
    mutationFn: async (on: boolean) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: PAYMENT_ENABLED_KEY, bool_value: on, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: (_d, on) => {
      toast.success(on ? "Payment step turned on" : "Payment step turned off");
      void queryClient.invalidateQueries({ queryKey: paymentEnabledQuery.queryKey });
    },
    onError: () => toast.error("Could not update the payment setting."),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    void queryClient.invalidateQueries({ queryKey: ["menu"] });
  };

  const save = useMutation({
    mutationFn: async (value: Draft) => {
      const payload = {
        name: value.name.trim(),
        description: value.description.trim(),
        price: Number(value.price),
        category: value.category,
        image_url: value.image_url.trim() === "" ? null : value.image_url.trim(),
        is_available: value.is_available,
      };
      const { error } = value.id
        ? await supabase.from("menu_items").update(payload).eq("id", value.id)
        : await supabase.from("menu_items").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Menu saved");
      setDraft(null);
      invalidate();
    },
    onError: () => toast.error("Could not save that item."),
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not update availability."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted");
      invalidate();
    },
    onError: () => toast.error("Could not delete that item."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Menu management</h1>
          <p className="text-sm text-muted-foreground">
            Add items, adjust prices and mark things out of stock.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="size-4" /> New item
        </Button>
      </div>

      <div className="voyage-panel flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/50 bg-card p-5">
        <div>
          <h2 className="text-lg font-bold">Premium restaurant section</h2>
          <p className="text-sm text-muted-foreground">
            {premiumOpen ? "Open — customers can order premium food." : "Closed — premium food is hidden from customers."}
            {" "}Add premium dishes using the "Premium" category.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="premium-open"
            checked={premiumOpen}
            disabled={togglePremium.isPending}
            onCheckedChange={(checked) => togglePremium.mutate(checked)}
          />
          <Label htmlFor="premium-open">{premiumOpen ? "Open" : "Closed"}</Label>
        </div>
      </div>

      <div className="voyage-panel flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/50 bg-card p-5">
        <div>
          <h2 className="text-lg font-bold">Payment before ordering</h2>
          <p className="text-sm text-muted-foreground">
            {paymentEnabled
              ? "On — customers must pay by QR or choose cash at the food section before placing an order."
              : "Off — customers place orders without a payment step."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="payment-enabled"
            checked={paymentEnabled}
            disabled={togglePayment.isPending}
            onCheckedChange={(checked) => togglePayment.mutate(checked)}
          />
          <Label htmlFor="payment-enabled">{paymentEnabled ? "On" : "Off"}</Label>
        </div>
      </div>

      {draft ? (
        <form
           className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{draft.id ? "Edit item" : "New item"}</h2>
            <Button type="button" size="icon" variant="ghost" onClick={() => setDraft(null)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input
                id="m-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-price">Price (₹)</Label>
              <Input
                id="m-price"
                type="number"
                min="0"
                step="1"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-category">Category</Label>
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value as Category })}
              >
                <SelectTrigger id="m-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-image">Image URL (optional)</Label>
              <Input
                id="m-image"
                value={draft.image_url}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="m-desc">Short description</Label>
              <Textarea
                id="m-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="m-available"
                checked={draft.is_available}
                onCheckedChange={(checked) => setDraft({ ...draft, is_available: checked })}
              />
              <Label htmlFor="m-available">Available</Label>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save item"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <article
              key={item.id}
               className="voyage-panel overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)]"
            >
              <img
                src={itemImage(item)}
                alt={item.name}
                loading="lazy"
                width={944}
                height={704}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold leading-tight">{item.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                  <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={(checked) =>
                        toggleAvailability.mutate({ id: item.id, is_available: checked })
                      }
                      aria-label={`Toggle availability for ${item.name}`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.is_available ? "Available" : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${item.name}`}
                      onClick={() =>
                        setDraft({
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          price: String(Number(item.price)),
                          category: item.category as Category,
                          image_url: item.image_url ?? "",
                          is_available: item.is_available,
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => {
                        if (confirm(`Delete ${item.name}?`)) remove.mutate(item.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
