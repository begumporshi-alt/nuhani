/*
# Telegram customer tracking tables + order-status push to customers

## Summary
1. Two small tables for the telegram-bot edge function:
   - telegram_track_requests — pending phone-verification requests, one per
     Telegram chat (chat id is the PK); the edge function enforces the TTL
     and cleans up expired/completed rows.
   - telegram_order_links — verified order ↔ customer-chat links. A customer
     proves ownership by matching the order's phone; once verified, every
     future status push for that order goes to that chat. Chat ids are the
     Telegram numeric chat ids handled as TEXT (String(chat.id) on the JS
     side).
2. Both tables have RLS ENABLED with NO policies — deny-all for anon and
   authenticated. The edge function uses the service-role key (bypasses RLS)
   and the trigger function below is SECURITY DEFINER owned by postgres, so
   nothing running in the browser can read or spoof chat links.
3. notify_order_status_telegram() + trigger on_order_status_notify_telegram
   (AFTER UPDATE OF status): pushes a customer-friendly message to every
   linked chat when orders.status really transitions into
   'shipped' / 'delivered' / 'cancelled'. Admin status updates come from the
   AdminOrders page (authenticated role).

## How verification works
Customer sends an order number to the bot → the edge function stores a
pending telegram_track_requests row for that chat → the customer proves
ownership by matching the order's phone (guest_phone or
shipping_address->>'phone') → the edge function removes the request row and
inserts the telegram_order_links row. All of that logic lives in the edge
function; this migration only provides the tables.

## Message formats (Markdown, same style as the admin pushes)
- shipped:   "🚚 *Your order NU-000123 has shipped!*" plus a "Courier: …"
             line when courier_name is set and a "Tracking: …" line when
             courier_tracking_id is set.
- delivered: "✅ *Your order NU-000123 was delivered!*"
- cancelled: "❌ *Your order NU-000123 was cancelled.*" plus a refund line
             with the order total (same trailing-zero amount rendering as
             the admin migrations) only when payment_status = 'paid'.
- Every message ends with "Thank you for shopping with Nuhani! 💛"

## Silence rules
- Same-status re-updates (NEW.status = OLD.status) never push.
- 'pending', legacy 'paid' and gateway-callback 'processing' never push —
  only real transitions INTO shipped / delivered / cancelled do.
- Orders with no linked chats (no telegram_order_links rows) push to
  nobody — that is not an error.
- Missing or empty site_settings.telegram_bot_token → silent skip.
- Courier-integration updates that do not touch status never fire the
  trigger (AFTER UPDATE OF status).
- Any failure is swallowed (RAISE WARNING only) so admin status updates can
  never break because of a push.
*/

-- ============================================================
-- 1. Tables for the telegram-bot edge function
-- ============================================================

-- Pending phone-verification requests (one per chat; TTL enforced by the
-- edge function, which deletes the row when verification completes).
CREATE TABLE IF NOT EXISTS public.telegram_track_requests (
  telegram_chat_id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- Verified order ↔ customer-chat links: the customer proved ownership by
-- matching the order's phone; future status pushes go to these chats.
CREATE TABLE IF NOT EXISTS public.telegram_order_links (
  telegram_chat_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (telegram_chat_id, order_id)
);

-- Deny-all to anon/authenticated: no policies on purpose. The edge function
-- uses the service-role key (bypasses RLS) and the trigger function below is
-- SECURITY DEFINER owned by postgres — nothing running in the browser needs
-- (or may get) access to chat links.
ALTER TABLE public.telegram_track_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_order_links ENABLE ROW LEVEL SECURITY;

-- The status-push trigger looks up links by order_id; the PK already covers
-- chat-side lookups.
CREATE INDEX IF NOT EXISTS idx_telegram_order_links_order
  ON public.telegram_order_links(order_id);

-- ============================================================
-- 2. Trigger function — customer push on shipped/delivered/cancelled
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_order_status_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token   text;
  v_message text;
  r         record;
BEGIN
  BEGIN
    -- Transition guards FIRST: same-status re-updates and any status that is
    -- not shipped/delivered/cancelled (pending, legacy 'paid', gateway
    -- 'processing') stay silent.
    IF NEW.status = OLD.status THEN
      RETURN NULL;
    END IF;
    IF NEW.status NOT IN ('shipped', 'delivered', 'cancelled') THEN
      RETURN NULL;
    END IF;

    -- Bot token lives in the single site_settings row. The function runs as
    -- its owner (postgres), so it reads it regardless of the admin-only RLS.
    SELECT s.telegram_bot_token
      INTO v_token
      FROM public.site_settings s
     LIMIT 1;

    -- Telegram not configured → stay silent, never block the status update.
    IF v_token IS NULL OR btrim(v_token) = '' THEN
      RETURN NULL;
    END IF;

    -- Customer message per status (same Markdown style as the admin pushes).
    IF NEW.status = 'shipped' THEN
      v_message := '🚚 *Your order ' || NEW.order_number || ' has shipped!*';
      IF NEW.courier_name IS NOT NULL THEN
        v_message := v_message || E'\nCourier: ' || NEW.courier_name;
      END IF;
      IF NEW.courier_tracking_id IS NOT NULL THEN
        v_message := v_message || E'\nTracking: ' || NEW.courier_tracking_id;
      END IF;
    ELSIF NEW.status = 'delivered' THEN
      v_message := '✅ *Your order ' || NEW.order_number || ' was delivered!*';
    ELSE
      -- cancelled — mention the refund only for paid orders
      v_message := '❌ *Your order ' || NEW.order_number || ' was cancelled.*';
      IF NEW.payment_status = 'paid' THEN
        v_message := v_message
          || E'\nA refund of ৳'
          || coalesce(rtrim(rtrim(NEW.total_amount::text, '0'), '.'), '0')
          || ' will be processed to your payment method.';
      END IF;
    END IF;

    v_message := v_message || E'\n\nThank you for shopping with Nuhani! 💛';

    -- One push per linked chat; a bad chat must not abort the loop.
    FOR r IN
      SELECT l.telegram_chat_id
        FROM public.telegram_order_links l
       WHERE l.order_id = NEW.id
    LOOP
      BEGIN
        -- Fire-and-forget: pg_net queues the request and returns a request id
        -- immediately; the HTTP call happens in a background worker.
        PERFORM net.http_post(
          url                  := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
          body                 := jsonb_build_object(
                                  'chat_id',    r.telegram_chat_id,
                                  'text',       v_message,
                                  'parse_mode', 'Markdown'
                                ),
          headers              := '{"Content-Type": "application/json"}'::jsonb,
          timeout_milliseconds := 5000
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'telegram status push to chat % failed for order %: %',
          r.telegram_chat_id, NEW.id, SQLERRM;
      END;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- The push must never break an admin status update.
    RAISE WARNING 'telegram status notification failed for order %: %', NEW.id, SQLERRM;
  END;

  RETURN NULL;
END;
$$;

ALTER FUNCTION public.notify_order_status_telegram() OWNER TO postgres;

-- ============================================================
-- 3. Trigger — fires whenever an UPDATE's SET list touches status;
--    the transition guards inside keep only shipped/delivered/
--    cancelled transitions audible. Plain row trigger is enough:
--    admin status updates are single statements carrying all fields.
-- ============================================================
DROP TRIGGER IF EXISTS on_order_status_notify_telegram ON public.orders;
CREATE TRIGGER on_order_status_notify_telegram
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_telegram();

-- ============================================================
-- 4. Grants — the trigger runs with the updating role's privileges
--    (admin status updates come from authenticated); the function is
--    SECURITY DEFINER, so EXECUTE must stay available. service_role
--    (courier integration) is covered by the default PUBLIC EXECUTE grant.
-- ============================================================
GRANT EXECUTE ON FUNCTION public.notify_order_status_telegram() TO anon, authenticated;
