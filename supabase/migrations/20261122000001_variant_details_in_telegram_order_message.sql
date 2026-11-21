/*
# Variant size/color in the Telegram "New Order Received" message

## Summary
The order notification used to list items as
  `  • {product_name} x{quantity} — ৳{total_price}`
with no variant info, so the seller could not tell WHICH size/color a
customer ordered (e.g. China Wallet comes in Black/Pink/Beige/Khaki at the
same size and price). order_items.variant_details (jsonb, snapshotted by
place_order() at order time) already holds size and color — append them to
each item line:

  `  • {product_name} ({size} · {color}) x{quantity} — ৳{total_price}`

When a field is missing it is omitted; when both are missing the parenthesized
part disappears entirely (old format preserved).

## Scope
- Replaces public.notify_new_order_telegram() only. The current live body is
  the one from 20261121010000_telegram_payment_received_notify.sql (adds the
  "online payment still pending → stay silent" guard); it is copied here
  verbatim except for the variant-aware items aggregation.
- notify_payment_received_telegram() and notify_order_status_telegram() have
  no items list — untouched.
- Mirrors the same change in supabase/functions/telegram-bot/index.ts
  formatOrderMessage() (fallback path).
*/

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

    -- Items list, one line per item — same shape as the edge function, plus
    -- the size/color snapshotted into order_items.variant_details at order
    -- time:
    --   `  • {product_name} ({size} · {color}) x{quantity} — ৳{total_price}`
    -- concat_ws skips NULLs, so a missing size or color simply drops out and
    -- a variant_details-less item keeps the old bare line.
    SELECT string_agg(
             '  • ' || oi.product_name
               || CASE WHEN coalesce(btrim(oi.variant_details->>'size'), '') <> ''
                            OR coalesce(btrim(oi.variant_details->>'color'), '') <> ''
                       THEN ' (' || concat_ws(' · ',
                              nullif(btrim(oi.variant_details->>'size'), ''),
                              nullif(btrim(oi.variant_details->>'color'), '')) || ')'
                       ELSE ''
                  END
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

-- Trigger unchanged: CREATE OR REPLACE FUNCTION keeps the function OID, so the
-- existing deferred constraint trigger stays attached. EXECUTE grants must
-- remain available to the checkout caller (function is SECURITY DEFINER).
GRANT EXECUTE ON FUNCTION public.notify_new_order_telegram() TO anon, authenticated;
