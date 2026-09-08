import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Public origin of the storefront. MUST be set in production (e.g. https://nuhani.com)
// via `supabase secrets set PUBLIC_SITE_URL=...`. Falls back to the dev server.
function siteBase(): string {
  const base = Deno.env.get("PUBLIC_SITE_URL") ?? "http://localhost:5173";
  return base.replace(/\/+$/, "");
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

    const { action, order_id, payment_method, order_number, tran_id } = await req.json().catch(() => ({}));

    // Get payment settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("sslcommerz_store_id, sslcommerz_store_password, bkash_app_key, bkash_app_secret, bkash_username, bkash_password, nagad_merchant_id, nagad_api_key, payment_mode")
      .single();

    const mode = settings?.payment_mode ?? "sandbox";
    const callbackUrl = `${siteBase()}/order-confirmation`;

    // Fetch helper
    async function getOrder(orderId?: string, orderNum?: string) {
      let q = supabase.from("orders").select("*").limit(1);
      q = orderId ? q.eq("id", orderId) : q.eq("order_number", orderNum);
      const { data } = await q.maybeSingle();
      return data;
    }

    function json(body: unknown, status = 200) {
      return new Response(JSON.stringify(body), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_payment") {
      const order = await getOrder(order_id, order_number);
      if (!order) return json({ error: "Order not found" }, 404);

      // Server-authoritative amount and customer details — never trust the client
      const amount = Number(order.total_amount);
      const ship = (order.shipping_address ?? {}) as Record<string, string>;
      const customer = {
        full_name: ship.full_name ?? "Customer",
        email: order.guest_email ?? "noreply@example.com",
        phone: order.guest_phone ?? ship.phone ?? "",
        address: ship.address_line1 ?? "",
        city: ship.city ?? "",
      };

      if (payment_method === "bkash") {
        const base = mode === "sandbox" ? "https://tokenized.sandbox.bka.sh" : "https://tokenized.pay.bka.sh";

        // Get token
        const tokenRes = await fetch(`${base}/v1.2.0-beta/tokenized/checkout/token/grant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "username": settings?.bkash_username ?? "",
            "password": settings?.bkash_password ?? "",
          },
          body: JSON.stringify({
            app_key: settings?.bkash_app_key ?? "",
            app_secret: settings?.bkash_app_secret ?? "",
          }),
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.id_token) {
          return json({ error: "Failed to authenticate with bKash. Check the bKash credentials in Admin → Settings." }, 500);
        }

        // Create payment — the callback is validated against bKash before marking paid
        const createRes = await fetch(`${base}/v1.2.0-beta/tokenized/checkout/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": tokenData.id_token,
            "X-APP-Key": settings?.bkash_app_key ?? "",
          },
          body: JSON.stringify({
            mode: "0011",
            payerReference: customer.phone || " ",
            callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway?action=callback&method=bkash&order=${order.order_number}`,
            amount: String(amount),
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: order.order_number,
          }),
        });
        const createData = await createRes.json();

        if (createData.bkashURL) {
          await supabase
            .from("orders")
            .update({
              payment_gateway: "bkash",
              payment_gateway_tran_id: createData.paymentID,
              payment_status: "pending",
            })
            .eq("id", order.id);

          return json({ success: true, payment_url: createData.bkashURL, tran_id: createData.paymentID });
        }
        return json({ error: createData.statusMessage ?? "bKash payment creation failed" }, 400);
      }

      if (payment_method === "nagad") {
        // Nagad's DFS checkout requires an encrypted/signature flow that is not
        // implemented yet. Fail up-front so the customer can pick another method
        // instead of creating an unpayable order.
        return json({ error: "Nagad payments are temporarily unavailable. Please choose bKash, card or cash on delivery." }, 400);
      }

      if (payment_method === "card") {
        // SSLCommerz hosted checkout
        const sslczUrl = mode === "sandbox"
          ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
          : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

        const formData = new URLSearchParams();
        formData.append("store_id", settings?.sslcommerz_store_id ?? "");
        formData.append("store_passwd", settings?.sslcommerz_store_password ?? "");
        formData.append("total_amount", String(amount));
        formData.append("currency", "BDT");
        formData.append("tran_id", order.order_number);
        formData.append("success_url", `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway?action=callback&method=sslcz&order=${order.order_number}`);
        formData.append("fail_url", `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway?action=callback&method=sslcz&order=${order.order_number}`);
        formData.append("cancel_url", `${callbackUrl}/${order.order_number}?payment=cancelled`);
        formData.append("cus_name", customer.full_name);
        formData.append("cus_email", customer.email);
        formData.append("cus_phone", customer.phone);
        formData.append("cus_add1", customer.address);
        formData.append("cus_city", customer.city);
        formData.append("cus_country", "Bangladesh");
        formData.append("product_name", "Nuhani Order");
        formData.append("product_category", "Clothing");
        formData.append("product_profile", "general");
        formData.append("ship_name", customer.full_name);
        formData.append("ship_add1", customer.address);
        formData.append("ship_city", customer.city);
        formData.append("ship_country", "Bangladesh");
        formData.append("shipping_method", "YES");

        const sslczRes = await fetch(sslczUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });
        const sslczData = await sslczRes.json();

        if (sslczData.status === "SUCCESS" && sslczData.GatewayPageURL) {
          await supabase
            .from("orders")
            .update({
              payment_gateway: "sslcommerz",
              payment_gateway_tran_id: order.order_number,
              payment_gateway_url: sslczData.GatewayPageURL,
              payment_status: "pending",
            })
            .eq("id", order.id);

          return json({ success: true, payment_url: sslczData.GatewayPageURL, tran_id: order.order_number });
        }
        return json({ error: sslczData.failedreason ?? "SSLCommerz payment creation failed. Check the credentials in Admin → Settings." }, 400);
      }

      return json({ error: "Invalid payment method" }, 400);
    }

    if (action === "callback") {
      // Browser redirect back from the gateway (GET for bKash, POST form for SSLCommerz).
      // The status in the request is NEVER trusted — the gateway's own API is queried first.
      const url = new URL(req.url);
      let params: URLSearchParams = url.searchParams;

      if (req.method === "POST") {
        const form = await req.formData().catch(() => null);
        if (form) {
          params = new URLSearchParams();
          for (const [k, v] of form.entries()) params.append(k, String(v));
        }
      }

      const method = params.get("method") ?? url.searchParams.get("method") ?? "";
      const orderNum = params.get("order") ?? url.searchParams.get("order") ?? "";
      const order = await getOrder(undefined, orderNum);
      if (!order) return json({ error: "Order not found" }, 404);

      async function redirect(payment: "success" | "failed") {
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, "Location": `${callbackUrl}/${orderNum}?payment=${payment}` },
        });
      }

      // ---------- bKash: verify via Query Payment ----------
      if (method === "bkash") {
        const paymentID = params.get("paymentID") ?? order.payment_gateway_tran_id;
        const bKashStatus = params.get("status"); // only used to decide WHICH verification to run

        if (!paymentID) return redirect("failed");

        const base = mode === "sandbox" ? "https://tokenized.sandbox.bka.sh" : "https://tokenized.pay.bka.sh";
        const tokenRes = await fetch(`${base}/v1.2.0-beta/tokenized/checkout/token/grant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "username": settings?.bkash_username ?? "",
            "password": settings?.bkash_password ?? "",
          },
          body: JSON.stringify({
            app_key: settings?.bkash_app_key ?? "",
            app_secret: settings?.bkash_app_secret ?? "",
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.id_token) return redirect("failed");

        const queryRes = await fetch(`${base}/v1.2.0-beta/tokenized/checkout/payment/status?paymentID=${encodeURIComponent(paymentID)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": tokenData.id_token,
            "X-APP-Key": settings?.bkash_app_key ?? "",
          },
        });
        const paymentData = await queryRes.json();

        const completed =
          (bKashStatus === "success" && paymentData.transactionStatus === "Completed") ||
          paymentData.transactionStatus === "Completed";
        const amountOk = Number(paymentData.amount) === Number(order.total_amount);

        if (completed && amountOk) {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              payment_verified: true,
              status: "processing",
              payment_transaction_id: paymentData.trxID ?? null,
            })
            .eq("id", order.id);
          return redirect("success");
        }

        // Cancelled / failed at the gateway, or validation mismatch
        if (bKashStatus === "cancel" || paymentData.transactionStatus === "Cancelled") {
          await supabase
            .from("orders")
            .update({ payment_status: "failed", status: "cancelled" })
            .eq("id", order.id);
        }
        return redirect("failed");
      }

      // ---------- SSLCommerz: verify via Validation API ----------
      if (method === "sslcz") {
        const valId = params.get("val_id");
        const gatewayStatus = params.get("status");

        if (gatewayStatus === "CANCELLED" || gatewayStatus === "UNATTEMPTED") {
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id);
          return redirect("failed");
        }

        if (!valId) return redirect("failed");

        const validatorUrl = mode === "sandbox"
          ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
          : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";
        const vParams = new URLSearchParams({
          val_id: valId,
          store_id: settings?.sslcommerz_store_id ?? "",
          store_passwd: settings?.sslcommerz_store_password ?? "",
          v: "1",
          format: "json",
        });
        const vRes = await fetch(`${validatorUrl}?${vParams.toString()}`);
        const vData = await vRes.json().catch(() => null);

        const valid =
          vData &&
          (vData.status === "VALID" || vData.status === "VALIDATED") &&
          vData.tran_id === order.order_number &&
          Number(vData.amount) === Number(order.total_amount) &&
          vData.currency === "BDT";

        if (valid) {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              payment_verified: true,
              status: "processing",
              payment_transaction_id: vData.bank_tran_id ?? valId,
            })
            .eq("id", order.id);
          return redirect("success");
        }

        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", order.id);
        return redirect("failed");
      }

      return json({ error: "Unknown callback method" }, 400);
    }

    if (action === "verify_payment") {
      // Manual/server verification for a single order (admin support tool)
      const order = await getOrder(undefined, order_number);
      if (!order) return json({ error: "Order not found" }, 404);
      return json({
        order_number: order.order_number,
        payment_status: order.payment_status,
        payment_verified: order.payment_verified,
        payment_gateway: order.payment_gateway,
        transaction_id: order.payment_transaction_id,
      });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
