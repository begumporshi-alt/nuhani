/*
# Telegram "Payment Received" notification + skip unpaid online orders

## Summary
1. Gap #2: online-payment orders (bkash / nagad / card) must NOT ping
   "New Order Received" while unpaid. notify_new_order_telegram() gains one
   guard after the settings check: an insert with payment_status='pending'
   AND payment_method<>'cod' returns silently — nothing is sent until the
   payment lands.
2. New notify_payment_received_telegram() + trigger
   on_order_payment_received_notify_telegram (AFTER UPDATE OF payment_status):
   sends a "💳 Payment Received" message when payment_status really
   transitions INTO 'paid'. The only writer of 'paid' is the payment-gateway
   edge-function callback (service role), which sets payment_status='paid',
   payment_verified=true, status='processing' and payment_transaction_id
   in ONE UPDATE — every field the message needs is already in NEW.
3. Silence rules:
   - 'failed' / 'refunded' transitions never notify.
   - Repeated 'paid' → 'paid' updates never notify (OLD guard).
4. COD orders keep the insert-time "New Order Received" ping (COD money
   received is tracked by cod_verified — out of scope here).

## Replaces
- Nothing removed. 20261121000000_reliable_telegram_order_notify.sql still
  owns the insert-time constraint trigger; this file adds the unpaid-online
  guard and the payment-transition notification.
- Part 1 below is the same function body byte-for-byte except the added
  guard. pg_net's functions live in the `net` schema (verified live:
  net.http_post(url text, body jsonb, params jsonb, headers jsonb,
  timeout_milliseconds int) RETURNS bigint), as already called in
  20261121000000.

## Message format
Same Markdown style as the order message (asterisks, ৳ amounts, Asia/Dhaka
time). There is no paid_at column, so the time line uses the trigger's own
now(). Amounts are rendered the way JavaScript renders numbers (trailing
".00"/".0" trimmed), matching the order message.
*/

-- ============================================================
-- 1. Insert-time notify — now skips online orders that are still
--    unpaid (payment_status = 'pending', payment_method <> 'cod')
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

    -- Online payments still unpaid must not ping "New Order Received";
    -- they get a "Payment Received" message when payment_status → 'paid'
    -- (see notify_payment_received_telegram / trigger below).
    IF NEW.payment_status = 'pending' AND NEW.payment_method <> 'cod' THEN
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
-- 2. Payment-received notify — fires only on a real transition
--    INTO 'paid' (the payment-gateway callback UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_payment_received_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token   text;
  v_chat_id text;
  v_time    text;
  v_message text;
BEGIN
  BEGIN
    -- Transition guard FIRST — notify only on a real pending→paid move:
    -- - NEW is not 'paid' (pending / failed / refunded)  → silent
    -- - OLD was already 'paid' (paid→paid re-update)     → silent
    IF NEW.payment_status <> 'paid' OR OLD.payment_status = 'paid' THEN
      RETURN NULL;
    END IF;

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

    -- No paid_at column exists, so the trigger's own now() is used, rendered
    -- like the order message's toLocaleString("en-GB", {timeZone:"Asia/Dhaka"})
    -- → DD/MM/YYYY, HH24:MI:SS
    v_time := to_char(now() AT TIME ZONE 'Asia/Dhaka', 'DD/MM/YYYY, HH24:MI:SS');

    -- Message body — same Markdown style as the order message.
    v_message :=
      '💳 *Payment Received!*'                                             || E'\n' ||
      ''                                                                   || E'\n' ||
      '*Order:* '    || NEW.order_number                                   || E'\n' ||
      '*Customer:* ' || coalesce(NEW.shipping_address->>'full_name', 'N/A')       || E'\n' ||
      '*Phone:* '    || coalesce(NEW.guest_phone,
                                 NEW.shipping_address->>'phone', 'N/A')    || E'\n' ||
      '*Amount:* ৳'  || coalesce(rtrim(rtrim(NEW.total_amount::text, '0'), '.'), '0') || E'\n' ||
      '*Method:* '   || NEW.payment_method || ' (paid)'                    || E'\n' ||
      '*Txn:* '      || coalesce(NEW.payment_transaction_id, 'N/A')        || E'\n' ||
      ''                                                                   || E'\n' ||
      '*Time:* '     || v_time;

    -- Fire-and-forget: pg_net queues the request and returns a request id
    -- immediately; the HTTP call happens in a background worker. Same payload
    -- as the order message: { chat_id, text, parse_mode: "Markdown" }.
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
    -- The notification must never abort the payment callback.
    RAISE WARNING 'telegram payment notification failed for order %: %', NEW.id, SQLERRM;
  END;

  RETURN NULL;
END;
$$;

ALTER FUNCTION public.notify_payment_received_telegram() OWNER TO postgres;

-- ============================================================
-- 3. Trigger — fires whenever an UPDATE's SET list touches
--    payment_status; the transition guard inside keeps only a real
--    pending→paid audible. Plain row trigger is enough: the gateway
--    callback is a single UPDATE already carrying every field the
--    message needs.
-- ============================================================
DROP TRIGGER IF EXISTS on_order_payment_received_notify_telegram ON public.orders;
CREATE TRIGGER on_order_payment_received_notify_telegram
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_received_telegram();

-- ============================================================
-- 4. Grants — trigger functions run with the calling role's privileges;
--    both functions are SECURITY DEFINER, so EXECUTE must stay available
--    to the checkout caller and the payment callback. (Re-granting
--    notify_new_order_telegram is harmless — CREATE OR REPLACE preserves
--    grants — and keeps this file self-contained. service_role is covered
--    by the default PUBLIC EXECUTE grant.)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.notify_new_order_telegram() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_payment_received_telegram() TO anon, authenticated;
