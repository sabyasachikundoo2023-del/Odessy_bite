import mealsImg from "@/assets/cat-meals.jpg";
import snacksImg from "@/assets/cat-snacks.jpg";
import beveragesImg from "@/assets/cat-beverages.jpg";
import essentialsImg from "@/assets/cat-essentials.jpg";

export const CATEGORIES = ["Premium", "Meals", "Snacks", "Beverages", "Essentials"] as const;
export const PREMIUM_CATEGORY = "Premium";
export const PREMIUM_DELIVERY_CHARGE = 11;
export type Category = (typeof CATEGORIES)[number];

export const ORDER_STATUSES = [
  "Placed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const categoryImages: Record<string, string> = {
  Meals: mealsImg,
  Snacks: snacksImg,
  Beverages: beveragesImg,
  Essentials: essentialsImg,
};

export function itemImage(item: { image_url: string | null; category: string }) {
  return item.image_url && item.image_url.trim().length > 0
    ? item.image_url
    : (categoryImages[item.category] ?? mealsImg);
}

export function formatPrice(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `₹${n.toFixed(0)}`;
}

export function statusIndex(status: string) {
  const i = ORDER_STATUSES.indexOf(status as OrderStatus);
  return i < 0 ? 0 : i;
}
