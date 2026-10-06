DROP POLICY "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(customer_name)) BETWEEN 1 AND 100
  AND char_length(trim(table_number)) BETWEEN 1 AND 20
  AND total >= 0
  AND delivery_charge >= 0
  AND status = 'Placed'::order_status
);

DROP POLICY "Anyone can add order items" ON public.order_items;
CREATE POLICY "Anyone can add order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(item_name)) BETWEEN 1 AND 200
  AND quantity > 0
  AND quantity <= 100
  AND unit_price >= 0
);