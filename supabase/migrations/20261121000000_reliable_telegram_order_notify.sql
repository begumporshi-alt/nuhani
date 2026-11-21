/*
# Reliable Telegram "New Order Received" notification

## Summary
1. Enables pg_net so PostgreSQL can send outbound HTTP requests.
2. notify_new_order_telegram(): SECURITY DEFINER trigger function that reads
   telegram_bot_token / telegram_chat_id from the single site_settings row and
   posts the "New Order Received" message to the admin chat via
   net.http_post (fire-and-forget, 5s timeout).
3. Attached to public.orders as a DEFERRABLE INITIALLY DEFERRED constraint
   trigger:
   - place_order() inserts the orders row BEFORE the order_items rows (same
     transaction), so a plain AFTER INSERT trigger would see zero items.
   - INITIALLY DEFERRED fires at COMMIT, when all items are visible.
   - A rolled-back order (stock failure, coupon error, ...) never notifies,
     so there is exactly one notification per committed order.
4. Every failure path (missing settings, pg_net error, SQL error) is swallowed,
   so an order can never fail because of the notification.

## Replaces
- The fire-and-forget `telegram-bot` edge-function call from Checkout.tsx,
  which was lost whenever the tab closed or the user redirected early.
- The edge function stays in place for webhook/callback handling.

## Message format
Line-for-line identical to formatOrderMessage() in
supabase/functions/telegram-bot/index.ts (same lines, Markdown asterisks,
emoji, ৳ amounts). Numeric amounts are rendered the way JavaScript renders
numbers (trailing ".00"/".0" trimmed) to match the template-literal output.
*/

-- ============================================================
-- 1. pg_net — outbound HTTP from PostgreSQL
--    (pg_net creates its own `net` schema; functions are called
--     as net.http_post — see Supabase pg_net docs)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 2. Trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_order_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token   text;
  v_chat_id text;
  v_items   text;
  v_time    text;
  v_message text;
BEGIN
  BEGIN
    -- Settings live in the single site_settings row. The function runs as its
    -- owner (postgres), so it reads them regardless of the admin-only RLS on
    -- site_settings.
    SELECT s.telegram_bot_token, s.telegram_chat_id
      INTO v_token, v_chat_id
      FROM public.site_settings s
     LIMIT 1;

    -- Telegram not configured → stay silent, never block or notify.
    IF v_token IS NULL OR btrim(v_token) = ''
       OR v_chat_id IS NULL OR btrim(v_chat_id) = '' THEN
      RETURN NULL;
    END IF;

    -- Items list, one line per item — same shape as the edge function:
    --   `  • {product_name} x{quantity} — ৳{total_price}`
    SELECT string_agg(
             '  • ' || oi.product_name
               || ' x' || oi.quantity::text
               || ' — ৳' || rtrim(rtrim(oi.total_price::text, '0'), '.'),
             E'\n'
             ORDER BY oi.created_at, oi.id
           )
      INTO v_items
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id;

    -- Rendered like the edge function's
    -- toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) → DD/MM/YYYY, HH24:MI:SS
    v_time := coalesce(
      to_char(NEW.created_at AT TIME ZONE 'Asia/Dhaka', 'DD/MM/YYYY, HH24:MI:SS'),
      ''
    );

    -- Message body — mirrors formatOrderMessage() line for line.
    v_message :=
      '🛍️ *New Order Received!*'                                          || E'\n' ||
      ''                                                                  || E'\n' ||
      '*Order:* '    || NEW.order_number                                  || E'\n' ||
      '*Customer:* ' || coalesce(NEW.shipping_address->>'full_name', 'N/A')      || E'\n' ||
      '*Phone:* '    || coalesce(NEW.guest_phone,
                                 NEW.shipping_address->>'phone', 'N/A')   || E'\n' ||
      '*Payment:* '  || coalesce(NEW.payment_method, 'N/A')
                     || ' (' || coalesce(NEW.payment_status, 'pending') || ')'  || E'\n' ||
      '*Total:* ৳'   || coalesce(rtrim(rtrim(NEW.total_amount::text, '0'), '.'), '0') || E'\n' ||
      ''                                                                  || E'\n' ||
      '*Items:*'                                                          || E'\n' ||
      -- A trailing newline is appended only when items exist, so the blank
      -- line before *Address:* matches the edge function even with no items.
      coalesce(v_items || E'\n', '')                                      || E'\n' ||
      '*Address:* '  || coalesce(NEW.shipping_address->>'address_line1', '')
                     || ', ' || coalesce(NEW.shipping_address->>'city', '')
                     || ', ' || coalesce(NEW.shipping_address->>'district', '')  || E'\n' ||
      '*Time:* '     || v_time;

    -- Fire-and-forget: pg_net queues the request and returns a request id
    -- immediately; the HTTP call happens in a background worker. Same payload
    -- as the edge function: { chat_id, text, parse_mode: "Markdown" }.
    PERFORM net.http_post(
      url                  := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
      body                 := jsonb_build_object(
                                'chat_id',    v_chat_id,
                                'text',       v_message,
                                'parse_mode', 'Markdown'
                              ),
      headers              := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    -- The notification must never abort the order insert.
    RAISE WARNING 'telegram order notification failed for order %: %', NEW.id, SQLERRM;
  END;

  RETURN NULL;
END;
$$;

ALTER FUNCTION public.notify_new_order_telegram() OWNER TO postgres;

-- ============================================================
-- 3. Trigger — deferred so the order_items rows that place_order() inserts
--    after the orders row are visible at fire time, and so rolled-back
--    orders (stock failures etc.) never notify.
-- ============================================================
DROP TRIGGER IF EXISTS on_order_created_notify_telegram ON public.orders;
CREATE CONSTRAINT TRIGGER on_order_created_notify_telegram
  AFTER INSERT ON public.orders
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order_telegram();

-- The trigger runs with the calling role's privileges; the function is
-- SECURITY DEFINER, so EXECUTE must remain available to the checkout caller.
GRANT EXECUTE ON FUNCTION public.notify_new_order_telegram() TO anon, authenticated;
