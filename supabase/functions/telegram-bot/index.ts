import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Origin, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  total_amount: number | null;
  guest_phone: string | null;
  guest_email: string | null;
  shipping_address: Record<string, string> | null;
  courier_name: string | null;
  courier_tracking_id: string | null;
  created_at: string;
}

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;

async function getSettings(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("telegram_bot_token, telegram_chat_id, telegram_bot_username")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  return data;
}

function formatOrderMessage(order: OrderRow, items: { product_name: string; quantity: number; total_price: number }[]): string {
  const addr = order.shipping_address ?? {};
  const lines: string[] = [
    "🛍️ *New Order Received!*",
    "",
    `*Order:* ${order.order_number}`,
    `*Customer:* ${addr.full_name ?? "N/A"}`,
    `*Phone:* ${order.guest_phone ?? addr.phone ?? "N/A"}`,
    `*Payment:* ${order.payment_method ?? "N/A"} (${order.payment_status ?? "pending"})`,
    `*Total:* ৳${order.total_amount ?? 0}`,
    "",
    "*Items:*",
    ...items.map((it) => `  • ${it.product_name} x${it.quantity} — ৳${it.total_price}`),
    "",
    `*Address:* ${addr.address_line1 ?? ""}, ${addr.city ?? ""}, ${addr.district ?? ""}`,
    `*Time:* ${new Date(order.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}`,
  ];
  return lines.join("\n");
}

async function sendTelegramMessage(token: string, chatId: string, text: string, replyMarkup?: unknown) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const resp = await fetch(`${TELEGRAM_API(token)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Telegram API error ${resp.status}: ${errText}`);
  }
  return resp.json();
}

async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API(token)}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}


// How long a pending phone-verification request stays valid (the customer must
// reply with the order's phone within this window).
const TRACK_TTL_MS = 10 * 60 * 1000;

function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D+/g, "");
}

// The customer proves order ownership by matching the phone used at checkout
// (guest_phone for guests; shipping_address.phone is captured for everyone).
// Exact digits match, or last-10-digits match so +880-prefixed forms compare
// equal to local 0-prefixed forms.
function phoneMatches(providedText: string, order: OrderRow): boolean {
  const provided = digitsOnly(providedText);
  if (provided.length < 6) return false;
  const stored = [order.guest_phone, order.shipping_address?.phone]
    .map(digitsOnly)
    .filter((d) => d.length > 0);
  return stored.some(
    (d) =>
      d === provided ||
      (provided.length >= 10 && d.length >= 10 && provided.slice(-10) === d.slice(-10))
  );
}

function phoneVerificationPrompt(orderNumber: string): string {
  return (
    `🔒 To protect your privacy, please reply with the *phone number* you used for order *${orderNumber}*.\n\n` +
    `Once it matches, I'll show the status — and you'll also get a message here when the order ships or is delivered.`
  );
}

function formatTrackingReply(order: OrderRow): string {
  const statusEmoji: Record<string, string> = {
    pending: "⏳", processing: "📦", shipped: "🚚", delivered: "✅", cancelled: "❌",
  };
  return [
    `📦 *Order ${order.order_number}*`,
    `Status: ${statusEmoji[order.status] ?? "📋"} ${order.status}`,
    `Payment: ${order.payment_status}`,
    order.courier_name ? `Courier: ${order.courier_name}` : "",
    order.courier_tracking_id ? `Tracking: ${order.courier_tracking_id}` : "",
    `Total: ৳${order.total_amount}`,
  ].filter(Boolean).join("\n");
}

// Shared by the text-message branch and the legacy track: callback. Looks up
// the order; if this chat already verified it, show the status immediately,
// otherwise store a pending request and ask for the order's phone.
async function handleOrderNumberRequest(supabase: any, token: string, chatId: string, orderNumber: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, courier_name, courier_tracking_id, total_amount, created_at")
    .eq("order_number", orderNumber)
    .maybeSingle() as { data: OrderRow | null };

  if (!order) {
    await sendTelegramMessage(token, chatId, `Sorry, I couldn't find order *${orderNumber}*. Please check the order number and try again. You can find it in your order confirmation email or SMS.`);
    return;
  }

  const { data: link } = await supabase
    .from("telegram_order_links")
    .select("telegram_chat_id")
    .eq("telegram_chat_id", chatId)
    .eq("order_id", order.id)
    .maybeSingle();

  if (link) {
    await sendTelegramMessage(token, chatId, formatTrackingReply(order));
    return;
  }

  await supabase
    .from("telegram_track_requests")
    .upsert({ telegram_chat_id: chatId, order_id: order.id }, { onConflict: "telegram_chat_id" });
  await sendTelegramMessage(token, chatId, phoneVerificationPrompt(order.order_number));
}

// Returns true when the message was consumed as a phone-verification attempt.
// A pending chat replying with a digit-heavy text is the phone attempt.
async function handlePhoneAttempt(supabase: any, token: string, chatId: string, providedText: string): Promise<boolean> {
  if (digitsOnly(providedText).length < 6) return false;

  const { data: pending } = await supabase
    .from("telegram_track_requests")
    .select("order_id, requested_at")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (!pending) return false;

  if (Date.now() - new Date(pending.requested_at as string).getTime() > TRACK_TTL_MS) {
    await supabase.from("telegram_track_requests").delete().eq("telegram_chat_id", chatId);
    await sendTelegramMessage(token, chatId, "⌛ That verification request expired. Please send your order number (e.g. *NU-000123*) to start again.");
    return true;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, courier_name, courier_tracking_id, total_amount, created_at, guest_phone, shipping_address")
    .eq("id", pending.order_id as string)
    .maybeSingle() as { data: (OrderRow & { id: string }) | null };

  if (!order) {
    await supabase.from("telegram_track_requests").delete().eq("telegram_chat_id", chatId);
    await sendTelegramMessage(token, chatId, "Sorry, that order no longer exists. Please send your order number to start again.");
    return true;
  }

  if (phoneMatches(providedText, order)) {
    // Verified: remember this chat so future status changes push to it.
    await supabase
      .from("telegram_order_links")
      .upsert({ telegram_chat_id: chatId, order_id: order.id }, { onConflict: "telegram_chat_id,order_id", ignoreDuplicates: true });
    await supabase.from("telegram_track_requests").delete().eq("telegram_chat_id", chatId);
    await sendTelegramMessage(token, chatId, formatTrackingReply(order));
  } else {
    await sendTelegramMessage(token, chatId, `❌ That phone number didn't match order *${order.order_number}*. Reply with the phone number used for the order, or send your order number to start again.`);
  }
  return true;
}

// Forward a support request to the admin chat (shared by the text branch and
// the support_prompt button callback).
async function handleSupportRequest(token: string, adminChatId: string | null | undefined, customerChatId: string, customerName: string, customerUsername?: string) {
  if (!adminChatId) {
    await sendTelegramMessage(token, customerChatId, "Our support team is unavailable right now. Please try again later.");
    return;
  }
  await sendTelegramMessage(
    token, adminChatId,
    `🔔 *Support Request*\n\nFrom: ${customerName} (Chat ID: ${customerChatId})\n\nTap "Reply" to message this customer directly.`,
    { inline_keyboard: [[{ text: "💬 Reply to customer", url: `https://t.me/${customerUsername ?? ""}` }]] }
  );
  await sendTelegramMessage(token, customerChatId, "Our support team has been notified and will get back to you shortly. Thank you for your patience! 🙏");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);

    // Parse the body ONCE and reuse it in all handlers.
    // Reading req.json() a second time throws because the stream is already consumed.
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        // Body may be empty or non-JSON
      }
    }

    let action = url.searchParams.get("action");
    if (!action) {
      action = (body.action as string) ?? "";
    }

    // ─── Notify: send new order to admin Telegram chat ───────────────────
    if (action === "notify_order") {
      const orderId = body.order_id as string;
      if (!orderId) {
        return new Response(JSON.stringify({ error: "order_id is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const settings = await getSettings(supabase);
      if (!settings?.telegram_bot_token || !settings?.telegram_chat_id) {
        return new Response(JSON.stringify({ success: false, reason: "telegram_not_configured" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle() as { data: OrderRow | null; error: { message: string } | null };
      if (orderErr || !order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, quantity, total_price")
        .eq("order_id", orderId);

      const message = formatOrderMessage(order, items ?? []);
      await sendTelegramMessage(settings.telegram_bot_token, settings.telegram_chat_id, message);

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Telegram Webhook: handle incoming messages from customers ───────
    if (action === "webhook") {
      const update = body;
      const settings = await getSettings(supabase);
      if (!settings?.telegram_bot_token) {
        return new Response(JSON.stringify({ error: "telegram_not_configured" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = settings.telegram_bot_token;

      // Handle callback queries (button clicks)
      if (update.callback_query) {
        const cb = update.callback_query as { id: string; message?: { chat?: { id: number } }; data?: string; from?: { username?: string; first_name?: string } };
        const chatId = cb.message?.chat?.id;
        const data = cb.data as string;
        await answerCallbackQuery(token, cb.id);
        if (chatId) {
          const chat = String(chatId);
          if (data === "track_prompt") {
            await sendTelegramMessage(token, chat,
              "Send your order number (e.g. *NU-000123*) and I'll check it for you. You'll also get updates here when it ships or is delivered.");
          } else if (data === "support_prompt") {
            await handleSupportRequest(token, settings.telegram_chat_id, chat, cb.from?.first_name ?? "Customer", cb.from?.username);
          } else if (data?.startsWith("track:")) {
            await handleOrderNumberRequest(supabase, token, chat, data.slice(6).trim());
          }
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const msg = update.message as { chat?: { id: number }; text?: string; from?: { first_name?: string; username?: string } } | undefined;
      if (!msg?.chat?.id || !msg.text) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const chatId = String(msg.chat.id);
      const text = msg.text.trim();
      const lowerText = text.toLowerCase();

      // /start command
      if (lowerText === "/start") {
        await sendTelegramMessage(
          token, chatId,
          "👋 Welcome to *Nuhani*!\n\nI can help you track your order. Just send your order number (e.g. *NU-000123*).\n\nYou can also type *help* to see what I can do.",
          { inline_keyboard: [[{ text: "📦 Track My Order", callback_data: "track_prompt" }]] }
        );
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // /help command
      if (lowerText === "/help" || lowerText === "help") {
        await sendTelegramMessage(
          token, chatId,
          "Here's what I can do:\n\n• Send your *order number* (e.g. NU-000123) to track it\n• Type *support* to start a live chat with our team\n• Type *hours* to see our business hours",
        );
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Support request — forward to admin chat
      if (lowerText === "support" || lowerText === "help me" || lowerText.includes("customer service")) {
        await handleSupportRequest(token, settings.telegram_chat_id, chatId, msg.from?.first_name ?? "Customer", msg.from?.username);
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (lowerText === "hours") {
        await sendTelegramMessage(token, chatId, "🕐 Our customer service team is available *Saturday to Thursday, 9 AM to 8 PM*.");
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try to match an order number: NU-XXXXXX — gated behind phone verification
      const orderMatch = text.match(/NU-?\s?(\d{4,8})/i);
      if (orderMatch) {
        const orderNumber = `NU-${orderMatch[1].padStart(6, "0")}`;
        await handleOrderNumberRequest(supabase, token, chatId, orderNumber);
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // A pending verification: a digit-heavy reply is treated as the phone attempt.
      if (await handlePhoneAttempt(supabase, token, chatId, text)) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Default fallback
      await sendTelegramMessage(
        token, chatId,
        "I didn't quite understand that. 😊\n\nSend your *order number* (e.g. NU-000123) to track your order, or type *support* to chat with our team.",
        { inline_keyboard: [[{ text: "📦 Track My Order", callback_data: "track_prompt" }, { text: "💬 Support", callback_data: "support_prompt" }]] }
      );
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Set webhook URL ─────────────────────────────────────────────────
    if (action === "set_webhook") {
      const webhookUrl = body.webhook_url as string;
      const settings = await getSettings(supabase);
      if (!settings?.telegram_bot_token) {
        return new Response(JSON.stringify({ error: "telegram_not_configured" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const resp = await fetch(`${TELEGRAM_API(settings.telegram_bot_token)}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const result = await resp.json();
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
