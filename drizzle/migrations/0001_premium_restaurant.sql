ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_category_check;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_category_check CHECK (category IN ('Meals','Snacks','Beverages','Essentials','Premium'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge numeric NOT NULL DEFAULT 0;

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  bool_value boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (key, bool_value) VALUES ('premium_open', true);

INSERT INTO public.menu_items (name, description, price, category) VALUES
('Butter Chicken Thali', 'Restaurant-style butter chicken, dal makhani, naan, jeera rice and salad.', 349, 'Premium'),
('Paneer Tikka Platter', 'Tandoor-grilled paneer tikka with mint chutney and laccha onions.', 299, 'Premium'),
('Hyderabadi Dum Biryani', 'Slow-cooked dum biryani with raita and mirchi ka salan.', 379, 'Premium'),
('Wood-fired Margherita Pizza', 'Classic 10-inch pizza with fresh mozzarella and basil.', 329, 'Premium');