/*
# Nuhani — Security & Integrity Hardening

## Summary
1. ORDER PRIVACY: removes the world-readable SELECT policies on orders/order_items.
   Order creation now goes exclusively through place_order(); guests look up their
   order via get_guest_order() (order number + phone match).
2. SECRETS: site_settings is no longer publicly readable (admin only). Public pages
   read a safe subset via get_public_settings().
3. place_order(): atomic order creation — server-side pricing from variant prices,
   stock validation + decrement in one transaction, coupon validation (active /
   expiry / min order / max uses), free_shipping support, used_count increment.
4. Chat: guest access to chat tables removed entirely (all guest traffic goes
   through the chat-assistant edge function, which now enforces guest ownership).
5. Spam guards: newsletter + contact inserts move behind validating RPCs with
   per-hour caps.

## Replaces
- functions/decrement-stock (edge function deleted — stock moves inside place_order)
- Client-side coupon/total computation at checkout (now server-authoritative)
*/

-- ============================================================
-- 1. ORDER PRIVACY
-- ============================================================
-- Drop every policy that exposed orders/order_items to anonymous or broad reads.
DROP POLICY IF EXISTS "orders_guest_select" ON public.orders;        -- USING (true), all orders world-readable
DROP POLICY IF EXISTS "order_items_guest_select" ON public.order_items;
DROP POLICY IF EXISTS "orders_select_guest" ON public.orders;        -- anon, user_id IS NULL
DROP POLICY IF EXISTS "order_items_select_guest" ON public.order_items;
-- Order/item creation is RPC-only now; remove direct client INSERT paths.
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_guest" ON public.order_items;

-- ============================================================
-- 2. SITE SETTINGS — secrets stay server-side
-- ============================================================
DROP POLICY IF EXISTS "settings_read_all" ON public.site_settings;

CREATE POLICY "settings_select_admin" ON public.site_settings FOR SELECT
  TO authenticated USING (public.is_admin());

-- Public pages use this RPC; it never returns credentials.
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'logo_url', s.logo_url,
    'site_name', s.site_name,
    'phone', s.phone,
    'email', s.email,
    'address', s.address,
    'instagram_url', s.instagram_url,
    'facebook_url', s.facebook_url,
    'youtube_url', s.youtube_url,
    'twitter_url', s.twitter_url,
    'hero_image_url', s.hero_image_url,
    'hero_mobile_image_url', s.hero_mobile_image_url,
    'whatsapp_number', s.whatsapp_number,
    'telegram_bot_username', s.telegram_bot_username,
    'courier_provider', s.courier_provider
  )
  FROM site_settings s
  LIMIT 1
$$;

-- ============================================================
-- 3. place_order() — atomic, server-priced order creation
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,            -- [{"variant_id": "...", "quantity": 2}, ...]
  p_shipping jsonb,         -- {full_name, phone, email, address_line1, address_line2, city, district, division, postal_code}
  p_payment_method text,
  p_coupon_code text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_shipping numeric(10,2);
  v_total numeric(10,2);
  v_district text := coalesce(p_shipping->>'district', '');
  v_coupon coupons%rowtype;
  v_coupon_found boolean := false;
  v_free_shipping boolean := false;
  v_order record;
  v_item jsonb;
  v_qty int;
  v_variant record;
BEGIN
  IF p_payment_method NOT IN ('bkash', 'nagad', 'card', 'cod') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;
  IF coalesce(p_shipping->>'full_name', '') = ''
     OR coalesce(p_shipping->>'phone', '') = ''
     OR coalesce(p_shipping->>'address_line1', '') = ''
     OR coalesce(p_shipping->>'city', '') = ''
     OR v_district = '' THEN
    RAISE EXCEPTION 'Incomplete shipping address';
  END IF;
  IF v_user_id IS NULL AND coalesce(p_shipping->>'email', '') = '' THEN
    RAISE EXCEPTION 'Guest orders require an email address';
  END IF;

  -- Shipping rate by district (mirrors src/lib/constants.ts)
  v_shipping := CASE v_district
    WHEN 'Dhaka' THEN 60 WHEN 'Narayanganj' THEN 60 WHEN 'Gazipur' THEN 60 WHEN 'Narsingdi' THEN 60
    WHEN 'Manikganj' THEN 80 WHEN 'Munshiganj' THEN 80 WHEN 'Tangail' THEN 80 WHEN 'Kishoreganj' THEN 80
    WHEN 'Faridpur' THEN 100 WHEN 'Madaripur' THEN 100 WHEN 'Gopalganj' THEN 100
    ELSE 120
  END;

  -- Price + validate every line (row locks prevent concurrent oversell)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 99 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT pv.price, pv.size, pv.color, pv.stock_quantity,
           pv.is_active AS variant_active, p.name AS product_name, p.is_active AS product_active
      INTO v_variant
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = (v_item->>'variant_id')::uuid
      FOR UPDATE OF pv;

    IF NOT found THEN
      RAISE EXCEPTION 'A product in your cart is no longer available';
    END IF;
    IF NOT v_variant.variant_active OR NOT v_variant.product_active THEN
      RAISE EXCEPTION 'Product is not available: %', v_variant.product_name;
    END IF;
    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (requested %, available %)',
        v_variant.product_name, v_qty, v_variant.stock_quantity;
    END IF;

    v_subtotal := v_subtotal + (v_variant.price * v_qty);
  END LOOP;

  IF v_subtotal >= 3000 THEN
    v_shipping := 0;
  END IF;

  -- Coupon: revalidated server-side, never trusted from the client
  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
      FROM coupons
      WHERE upper(code) = upper(btrim(p_coupon_code))
      FOR UPDATE;
    v_coupon_found := found;

    IF NOT v_coupon_found THEN
      RAISE EXCEPTION 'Invalid coupon code';
    END IF;
    IF NOT v_coupon.is_active THEN
      RAISE EXCEPTION 'This coupon is no longer active';
    END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'This coupon has expired';
    END IF;
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'This coupon has reached its usage limit';
    END IF;
    IF v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'This coupon requires a minimum order of % BDT', v_coupon.min_order_amount;
    END IF;

    IF v_coupon.type = 'percentage' THEN
      v_discount := round(v_subtotal * v_coupon.value / 100.0, 2);
    ELSIF v_coupon.type = 'flat' THEN
      v_discount := least(v_coupon.value, v_subtotal);
    ELSIF v_coupon.type = 'free_shipping' THEN
      v_discount := 0;
      v_free_shipping := true;
    END IF;
  END IF;

  IF v_free_shipping THEN
    v_shipping := 0;
  END IF;

  v_total := greatest(v_subtotal - v_discount + v_shipping, 0);

  INSERT INTO orders (
    user_id, guest_email, guest_phone,
    status, payment_method, payment_status,
    subtotal, discount_amount, shipping_amount, total_amount,
    coupon_code, shipping_address, notes
  ) VALUES (
    v_user_id,
    CASE WHEN v_user_id IS NULL THEN p_shipping->>'email' END,
    CASE WHEN v_user_id IS NULL THEN p_shipping->>'phone' END,
    'pending', p_payment_method, 'pending',
    v_subtotal, v_discount, v_shipping, v_total,
    CASE WHEN v_coupon_found THEN v_coupon.code END,
    p_shipping, NULLIF(btrim(coalesce(p_notes, '')), '')
  )
  RETURNING id, order_number INTO v_order;

  -- Line items + stock decrement in the same transaction
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;

    SELECT pv.price, pv.size, pv.color, p.name AS product_name
      INTO v_variant
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = (v_item->>'variant_id')::uuid;

    INSERT INTO order_items (order_id, variant_id, product_name, variant_details, quantity, unit_price, total_price)
    VALUES (
      v_order.id,
      (v_item->>'variant_id')::uuid,
      v_variant.product_name,
      jsonb_build_object('size', v_variant.size, 'color', v_variant.color),
      v_qty,
      v_variant.price,
      v_variant.price * v_qty
    );

    UPDATE product_variants
      SET stock_quantity = stock_quantity - v_qty
      WHERE id = (v_item->>'variant_id')::uuid;
  END LOOP;

  IF v_coupon_found THEN
    UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'subtotal', v_subtotal,
    'discount_amount', v_discount,
    'shipping_amount', v_shipping,
    'total_amount', v_total
  );
END;
$$;

-- ============================================================
-- 4. Guest order lookup (order number + phone)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_guest_order(p_order_number text, p_phone text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'order', to_jsonb(o),
    'items', (SELECT coalesce(jsonb_agg(to_jsonb(oi) ORDER BY oi.created_at), '[]'::jsonb)
              FROM order_items oi WHERE oi.order_id = o.id)
  )
  FROM orders o
  WHERE o.order_number = upper(btrim(p_order_number))
    AND o.user_id IS NULL
    AND (o.guest_phone = btrim(p_phone) OR o.shipping_address->>'phone' = btrim(p_phone))
  LIMIT 1
$$;

-- ============================================================
-- 5. CHAT — guests go through the edge function only
-- ============================================================
DROP POLICY IF EXISTS "chat_conv_anon_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_msg_anon_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_conv_anon_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_msg_anon_insert" ON public.chat_messages;

-- ============================================================
-- 6. SPAM GUARDS — newsletter + contact behind validating RPCs
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "anon_insert_contact_messages" ON public.contact_messages;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(p_email, '')));
BEGIN
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Please enter a valid email address';
  END IF;
  IF length(v_email) > 254 THEN
    RAISE EXCEPTION 'Email address is too long';
  END IF;
  -- Global rate cap
  IF (SELECT count(*) FROM subscribers WHERE created_at > now() - interval '1 hour') >= 50 THEN
    RAISE EXCEPTION 'Too many subscriptions right now. Please try again later.';
  END IF;

  IF EXISTS (SELECT 1 FROM subscribers WHERE email = v_email) THEN
    RETURN jsonb_build_object('already_subscribed', true);
  END IF;

  INSERT INTO subscribers (email) VALUES (v_email);
  RETURN jsonb_build_object('subscribed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_contact(p_name text, p_email text, p_subject text, p_message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'Please provide your name (2-120 characters)';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Please enter a valid email address';
  END IF;
  IF length(v_subject) < 2 OR length(v_subject) > 200 THEN
    RAISE EXCEPTION 'Please provide a subject (2-200 characters)';
  END IF;
  IF length(v_message) < 10 OR length(v_message) > 4000 THEN
    RAISE EXCEPTION 'Please write a message (10-4000 characters)';
  END IF;
  -- Global rate cap
  IF (SELECT count(*) FROM contact_messages WHERE created_at > now() - interval '1 hour') >= 30 THEN
    RAISE EXCEPTION 'Too many messages right now. Please try again later.';
  END IF;

  INSERT INTO contact_messages (name, email, subject, message)
  VALUES (v_name, v_email, v_subject, v_message);
  RETURN jsonb_build_object('submitted', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact(text, text, text, text) TO anon, authenticated;
