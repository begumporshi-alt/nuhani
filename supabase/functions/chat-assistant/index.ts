import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Knowledge base for the store — used to answer common questions
const STORE_KB = {
  name: "Nuhani",
  shipping: "We offer free shipping on orders over ৳3,000. Standard delivery takes 2-5 business days within Bangladesh.",
  returns: "You can return any item within 7 days of delivery, provided it's unworn and in original packaging with tags.",
  payment: "We accept bKash, card (SSLCommerz), and Cash on Delivery (COD). COD orders are verified via phone call before dispatch.",
  sizing: "We have a detailed size guide available on each product page. If you're unsure, feel free to ask us!",
  cod: "Yes, Cash on Delivery is available nationwide. A verification call will be made to confirm your order before dispatch.",
  contact: "You can reach us via the Contact page, or chat with us right here! Our team responds during business hours (9 AM - 8 PM).",
  hours: "Our customer service team is available Saturday to Thursday, 9 AM to 8 PM.",
  exchange: "Exchanges are available within 7 days for different sizes or colors, subject to stock availability.",
};

// Extract an order number from a message (Nuhani order numbers look like NU-000123)
function extractOrderNumber(msg: string): string | null {
  const match = msg.match(/NU-?\s?(\d{4,8})/i);
  return match ? `NU-${match[1].padStart(6, "0")}` : null;
}

// Extract a phone number from a message — Bangladeshi numbers like 01XXXXXXXXX
function extractPhone(msg: string): string | null {
  const match = msg.match(/01\d{9}/);
  return match ? match[0] : null;
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

    const { action, conversation_id, message, guest_id, guest_name, guest_email, user_id, order_number, phone } = await req.json();

    function json(body: unknown, status = 200) {
      return new Response(JSON.stringify(body), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is an admin (checks the JWT that supabase.functions.invoke forwards)
    async function callerIsAdmin(): Promise<boolean> {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return false;
      const anon = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await anon.auth.getUser();
      if (!userData?.user) return false;
      const { data: profile } = await anon
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();
      return profile?.role === "admin";
    }

    // Guest conversations can only be touched when the caller presents the matching guest_id
    async function canAccessConversation(conv: { user_id: string | null; guest_id: string | null }): Promise<boolean> {
      if (conv.user_id) return true; // customer conversations are read-only via this path anyway
      if (!conv.guest_id) return true;
      return guest_id === conv.guest_id;
    }

    if (action === "start_conversation") {
      const convData: Record<string, unknown> = {
        status: "active",
        last_message_at: new Date().toISOString(),
      };
      if (user_id) convData.user_id = user_id;
      if (guest_id) convData.guest_id = guest_id;
      if (guest_name) convData.guest_name = guest_name;
      if (guest_email) convData.guest_email = guest_email;

      const { data: conv, error: convError } = await supabase
        .from("chat_conversations")
        .insert(convData)
        .select()
        .single();

      if (convError) return json({ error: convError.message }, 500);

      const welcome = `Hello! Welcome to ${STORE_KB.name}! How can I help you today? You can ask me about products, shipping, returns, payment methods, sizing, or track your order by providing your order number and phone number.`;
      await supabase.from("chat_messages").insert({
        conversation_id: conv.id,
        sender: "bot",
        content: welcome,
      });

      return json({ conversation: conv, welcome });
    }

    if (action === "send_message") {
      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("id, user_id, guest_id")
        .eq("id", conversation_id)
        .maybeSingle();
      if (!conv) return json({ error: "Conversation not found" }, 404);
      if (!(await canAccessConversation(conv))) return json({ error: "Not authorized for this conversation" }, 403);

      // Save user message
      const { error: msgError } = await supabase.from("chat_messages").insert({
        conversation_id,
        sender: "user",
        content: message,
      });
      if (msgError) return json({ error: msgError.message }, 500);

      // Update conversation timestamp
      await supabase.from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation_id);

      // Generate a response based on keywords
      const lowerMsg = message.toLowerCase();
      let reply = "";

      if (lowerMsg.includes("track") || lowerMsg.includes("order status") || lowerMsg.includes("where is my order")) {
        const orderNum = extractOrderNumber(message);
        const phoneNum = extractPhone(message);

        if (orderNum && phoneNum) {
          const { data: order } = await supabase
            .from("orders")
            .select("order_number, status, payment_status, total_amount, courier_name, courier_tracking_id, created_at, order_items(product_name, quantity)")
            .eq("order_number", orderNum)
            .eq("guest_phone", phoneNum)
            .maybeSingle();

          if (order) {
            const statusMap: Record<string, string> = {
              pending: "Pending — waiting for payment confirmation",
              paid: "Paid — payment received, preparing your order",
              processing: "Processing — your order is being prepared",
              shipped: "Shipped — on the way to you",
              delivered: "Delivered — order has been delivered",
              cancelled: "Cancelled",
            };
            const items = (order as { order_items?: { quantity: number; product_name: string }[] }).order_items
              ?.map((it) => `${it.quantity}x ${it.product_name}`).join(", ") ?? "N/A";
            reply = `Order ${order.order_number}:\nStatus: ${statusMap[order.status] ?? order.status}\nPayment: ${order.payment_status}\nTotal: ৳${order.total_amount}\nItems: ${items}\nPlaced: ${new Date(order.created_at).toLocaleDateString("en-GB")}`;
            if (order.courier_name && order.courier_tracking_id) {
              reply += `\nCourier: ${order.courier_name} (Tracking: ${order.courier_tracking_id})`;
            }
          } else {
            reply = `I couldn't find an order with number ${orderNum} and phone ${phoneNum}. Please double-check and try again. Make sure to include both your order number and the phone number you used when placing the order.`;
          }
        } else {
          reply = "I can help you track your order! Please provide your **order number** (e.g. NU-000123) and the **phone number** you used when placing the order.";
        }
      } else if (lowerMsg.includes("shipping") || lowerMsg.includes("delivery") || lowerMsg.includes("deliver")) {
        reply = STORE_KB.shipping;
      } else if (lowerMsg.includes("return") || lowerMsg.includes("refund")) {
        reply = STORE_KB.returns;
      } else if (lowerMsg.includes("exchange") || lowerMsg.includes("swap")) {
        reply = STORE_KB.exchange;
      } else if (lowerMsg.includes("payment") || lowerMsg.includes("pay") || lowerMsg.includes("bkash") || lowerMsg.includes("card")) {
        reply = STORE_KB.payment;
      } else if (lowerMsg.includes("cod") || lowerMsg.includes("cash on delivery")) {
        reply = STORE_KB.cod;
      } else if (lowerMsg.includes("size") || lowerMsg.includes("sizing") || lowerMsg.includes("fit")) {
        reply = STORE_KB.sizing;
      } else if (lowerMsg.includes("contact") || lowerMsg.includes("reach") || lowerMsg.includes("phone") || lowerMsg.includes("email")) {
        reply = STORE_KB.contact;
      } else if (lowerMsg.includes("hour") || lowerMsg.includes("open") || lowerMsg.includes("time")) {
        reply = STORE_KB.hours;
      } else if (lowerMsg.includes("product") || lowerMsg.includes("item") || lowerMsg.includes("buy") || lowerMsg.includes("shop")) {
        reply = "You can browse our full collection on the Shop page. Is there a specific piece you're looking for?";
      } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey") || lowerMsg.includes("salam")) {
        reply = `Hello! Welcome to ${STORE_KB.name}. How can I assist you today?`;
      } else if (lowerMsg.includes("thank")) {
        reply = "You're welcome! Is there anything else I can help you with?";
      } else if (lowerMsg.includes("discount") || lowerMsg.includes("coupon") || lowerMsg.includes("offer")) {
        reply = "We regularly offer discounts and promotions! Check our homepage for current featured deals. You can also apply coupon codes at checkout for additional savings.";
      } else {
        const { data: products } = await supabase
          .from("products")
          .select("name, slug")
          .ilike("name", `%${message.split(" ")[0]}%`)
          .limit(3);

        if (products && products.length > 0) {
          reply = `I found some products that might interest you: ${products.map((p) => p.name).join(", ")}. You can find them on our Shop page!`;
        } else {
          reply = "I'd be happy to help! Could you tell me more about what you're looking for? I can assist with products, shipping, returns, payment, sizing, or tracking your order.";
        }
      }

      // Save bot response
      await supabase.from("chat_messages").insert({
        conversation_id,
        sender: "bot",
        content: reply,
      });

      return json({ reply });
    }

    if (action === "track_order") {
      const { data: order, error } = await supabase
        .from("orders")
        .select("order_number, status, payment_status, total_amount, courier_name, courier_tracking_id, created_at, order_items(product_name, quantity)")
        .eq("order_number", order_number)
        .eq("guest_phone", phone)
        .maybeSingle();

      if (error || !order) {
        return json({ error: "Order not found. Please check your order number and phone number." }, 404);
      }
      return json({ order });
    }

    if (action === "get_messages") {
      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("id, user_id, guest_id")
        .eq("id", conversation_id)
        .maybeSingle();
      if (!conv) return json({ error: "Conversation not found" }, 404);
      if (!(await canAccessConversation(conv))) return json({ error: "Not authorized for this conversation" }, 403);

      const { data: messages, error: msgError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true });

      if (msgError) return json({ error: msgError.message }, 500);
      return json({ messages });
    }

    if (action === "admin_reply") {
      if (!(await callerIsAdmin())) {
        return json({ error: "Admin access required" }, 403);
      }

      const { error: msgError } = await supabase.from("chat_messages").insert({
        conversation_id,
        sender: "admin",
        content: message,
      });
      if (msgError) return json({ error: msgError.message }, 500);

      await supabase.from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation_id);

      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
