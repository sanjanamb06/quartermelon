// verify-payment — Supabase Edge Function
//
// Receives Razorpay payment-completion details from the frontend, recomputes
// the expected HMAC-SHA256 signature server-side, and updates the payments
// and orders tables accordingly.
//
// Request body (JSON):
//   {
//     order_id:              string  — internal UUID from the orders table
//     razorpay_order_id:     string  — Razorpay order id (e.g. order_xxx)
//     razorpay_payment_id:   string  — Razorpay payment id (e.g. pay_xxx)
//     razorpay_signature:    string  — HMAC-SHA256 provided by Razorpay's SDK
//   }
//
// Success response (200):
//   { success: true, order_id: "<uuid>", order_code: "<QM-XXXXXX>" }
//
// Failure response (400 | 500):
//   { success: false, error: "<reason>" }

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const CLIENT_NOTIFICATION_EMAIL = "hello@quartermelon.in";

interface OrderAddressRow {
  id: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  pincode: string;
}

/** Invoke geocode-address database-update mode for a paid order (background task). */
async function invokePostPaymentGeocoding(
  supabaseUrl: string,
  serviceKey: string,
  order: OrderAddressRow,
): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/geocode-address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        addressLine1: order.address_line_1,
        addressLine2: order.address_line_2 ?? undefined,
        landmark: order.landmark ?? undefined,
        pincode: order.pincode,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "(no response body)");
      console.error(
        `Post-payment geocoding HTTP error for order ${order.id}: ${res.status} ${detail}`,
      );
      return;
    }

    const result = await res.json().catch(() => null) as { geocodeStatus?: string } | null;
    if (result?.geocodeStatus !== "success") {
      console.error(
        `Post-payment geocoding non-success for order ${order.id}:`,
        result,
      );
    }
  } catch (err) {
    console.error(`Post-payment geocoding threw for order ${order.id}:`, err);
  }
}

/** Encode a string to a Uint8Array (UTF-8). */
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Compute HMAC-SHA256 of `message` keyed with `secret` and return the result
 * as a lowercase hex string — exactly the format Razorpay uses for its
 * webhook / checkout signatures.
 */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encode(secret).buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encode(message).buffer as ArrayBuffer);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight — must run before any other logic.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only POST is accepted.
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  let body: {
    order_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    email?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const {
    order_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email,
  } = body;

  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Missing required fields: order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Environment variables ──────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server configuration error: missing Supabase env vars",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!razorpaySecret) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server configuration error: missing RAZORPAY_KEY_SECRET",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Build service-role Supabase client ─────────────────────────────────────
  // Service role bypasses RLS — required because neither the orders nor the
  // payments table grant the anon role any UPDATE access.
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // ── Step 1: Recompute expected signature ────────────────────────────────────
  // Razorpay's spec: HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id )
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = await hmacSha256Hex(razorpaySecret, payload);

  const signatureValid = safeEqual(expectedSignature, razorpay_signature);

  // ── Locate the payments row for this order ─────────────────────────────────
  // We match on both the internal order UUID AND the razorpay_order_id stored
  // on the payments row. This double-key lookup ensures a request cannot
  // accidentally or maliciously update a different order's payment row.
  const { data: paymentRow, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id, order_id, razorpay_order_id")
    .eq("order_id", order_id)
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();

  if (paymentLookupError) {
    console.error("Payment lookup error:", paymentLookupError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Database error while looking up payment",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!paymentRow) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "No matching payment record found for the given order_id and razorpay_order_id",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Step 2: Signature mismatch → mark payment as failed ────────────────────
  if (!signatureValid) {
    console.error("Signature mismatch for order:", order_id);

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_reason:
          "Signature mismatch: payment verification failed server-side",
      })
      .eq("id", paymentRow.id);

    if (paymentUpdateError) {
      // Log but do not expose DB details to the caller.
      console.error(
        "Failed to update payment status to failed:",
        paymentUpdateError,
      );
    }

    // Intentionally do NOT update orders.payment_status here.
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Payment verification failed: signature mismatch. Please contact support.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Step 3: Signature matches → mark payment captured, order paid ──────────

  // 3a. Update payments row: status → captured, record razorpay_payment_id.
  const { error: captureError } = await supabase
    .from("payments")
    .update({
      status: "captured",
      razorpay_payment_id: razorpay_payment_id,
    })
    .eq("id", paymentRow.id);

  if (captureError) {
    console.error("Failed to update payment to captured:", captureError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Database error while recording payment capture",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 3b. Update orders row: payment_status → paid.
  // Also stamp Razorpay IDs on the orders row for convenience / reporting.
  const { data: updatedOrder, error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
    })
    .eq("id", order_id)
    .select("id, order_id, customer_name, customer_phone, address_line_1, address_line_2, landmark, pincode, subtotal, delivery_fee, total, order_contents, maps_link, razorpay_payment_id, created_at")
    .maybeSingle();

  if (orderUpdateError) {
    console.error(
      "Failed to update order payment_status to paid:",
      orderUpdateError,
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: "Database error while updating order status",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!updatedOrder) {
    // Highly unexpected — the payment row existed but the order row did not.
    return new Response(
      JSON.stringify({
        success: false,
        error: "Order not found while attempting to mark as paid",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Step 3c: Post-payment geocoding (async, non-blocking) ─────────────────
  // Updates lat/lng/maps_link/geocode_status/delivery_fee on the orders row.
  // Payment success is never rolled back if this fails.
  EdgeRuntime.waitUntil(
    invokePostPaymentGeocoding(supabaseUrl, supabaseServiceKey, updatedOrder),
  );

  // ── Step 4: Send emails via Resend ──────────────────────────────────────────
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey) {
    // Construct address text
    const fullAddress = [
      updatedOrder.address_line_1,
      updatedOrder.address_line_2,
      updatedOrder.landmark,
      updatedOrder.pincode,
    ]
      .filter(Boolean)
      .join(",\n");

    const orderTimestamp = updatedOrder.created_at
      ? new Date(updatedOrder.created_at).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "medium",
        })
      : new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "medium",
        });

    // Construct items HTML list
    const fixedBundles = (updatedOrder.order_contents as any)?.fixedBundles || [];
    const customBundle = (updatedOrder.order_contents as any)?.customBundle;

    let itemsListHtml = "";
    if (fixedBundles.length > 0) {
      for (const item of fixedBundles) {
        itemsListHtml += `
          <div class="item-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
            <span class="item-name" style="color: #1A1A1A;">${item.displayName} &times; ${item.quantity}</span>
            <span class="item-price" style="font-weight: bold;">₹${item.unitPrice * item.quantity}</span>
          </div>
        `;
      }
    }
    if (customBundle && customBundle.items && customBundle.items.length > 0) {
      for (const item of customBundle.items) {
        itemsListHtml += `
          <div class="item-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
            <span class="item-name" style="color: #1A1A1A;">${item.name} &times; ${item.quantity}</span>
            <span class="item-price" style="font-weight: bold;">₹${item.price * item.quantity}</span>
          </div>
        `;
      }
    }

    // 4a. Send customer confirmation email
    if (email) {
      try {
        const customerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Quartermelon order is confirmed!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #fefefe;
      color: #1A1A1A;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid rgba(197, 216, 48, 0.2);
    }
    .logo {
      height: 48px;
    }
    .content {
      padding: 30px 0;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #2d4920;
      margin-top: 0;
    }
    .order-code {
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
      background-color: rgba(197, 216, 48, 0.15);
      padding: 8px 12px;
      border-radius: 8px;
      display: inline-block;
      margin: 10px 0;
    }
    .receipt {
      border: 1px solid rgba(26, 26, 26, 0.1);
      border-radius: 12px;
      padding: 20px;
      background-color: #fafafa;
      margin: 20px 0;
    }
    .receipt-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(26, 26, 26, 0.08);
      padding-bottom: 8px;
      color: #1A1A1A;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .item-name {
      color: #1A1A1A;
    }
    .item-price {
      font-weight: bold;
    }
    .divider {
      height: 1px;
      background-color: rgba(26, 26, 26, 0.08);
      margin: 15px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: bold;
      color: #2d4920;
    }
    .address {
      font-style: normal;
      font-size: 14px;
      line-height: 1.5;
      background-color: #fafafa;
      border: 1px solid rgba(26, 26, 26, 0.1);
      border-radius: 12px;
      padding: 15px;
      margin: 20px 0;
      white-space: pre-wrap;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: rgba(26, 26, 26, 0.6);
      border-top: 1px solid rgba(26, 26, 26, 0.1);
      padding-top: 20px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://quartermelon.in/logo_title.png" alt="Quartermelon" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <h1 style="display:none; color:#2d4920; font-family:sans-serif; margin:0;">Quartermelon</h1>
    </div>
    <div class="content">
      <h2 class="title">🍉 Your order is confirmed!</h2>
      <p>Hi ${updatedOrder.customer_name},</p>
      <p>Thank you for your order! We have successfully received your payment, and our team is already preparing your fresh box.</p>
      
      <p>Your Order ID:</p>
      <div class="order-code">${updatedOrder.order_id}</div>
      
      <div class="receipt">
        <div class="receipt-title">Order Details</div>
        ${itemsListHtml}
        <div class="divider"></div>
        <div class="item-row" style="color: rgba(26, 26, 26, 0.6)">
          <span>Subtotal</span>
          <span>₹${updatedOrder.subtotal}</span>
        </div>
        <div class="item-row" style="color: rgba(26, 26, 26, 0.6)">
          <span>Delivery Fee</span>
          <span>₹${updatedOrder.delivery_fee}</span>
        </div>
        <div class="divider"></div>
        <div class="total-row">
          <span>Total Paid</span>
          <span>₹${updatedOrder.total}</span>
        </div>
      </div>
      
      <h3 style="color:#2d4920; font-size:16px; margin-top:25px;">Delivery Address</h3>
      <div class="address">${fullAddress}</div>
      
      <p style="margin-top:25px;"><strong>We'll contact you shortly regarding your delivery.</strong></p>
      <p>If you have any questions, feel free to reach out to us on WhatsApp at <a href="https://wa.me/916364471003" style="color:#2d4920; font-weight:bold;">+91 63644 71003</a>.</p>
    </div>
    <div class="footer">
      <p>Thank you for choosing Quartermelon.</p>
      <p>&copy; 2026 Quartermelon. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Quartermelon <hello@quartermelon.in>",
            to: [email],
            subject: "🍉 Your Quartermelon order is confirmed!",
            html: customerHtml,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Resend customer email send failed with status ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error("Resend customer email exception:", err);
      }
    } else {
      console.error("Resend customer email skipped: no email provided in request body.");
    }

    // 4b. Send client notification email
    if (CLIENT_NOTIFICATION_EMAIL) {
      try {
        const clientHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Paid Order – ${updatedOrder.order_id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f3;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #e6e8e5;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    }
    .header {
      background-color: #2d4920;
      padding: 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 24px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #2d4920;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e6e8e5;
      padding-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .grid-row td {
      padding: 6px 0;
      font-size: 14px;
      vertical-align: top;
    }
    .grid-label {
      width: 35%;
      font-weight: 600;
      color: #666666;
    }
    .grid-value {
      width: 65%;
      color: #1a1a1a;
    }
    .badge {
      display: inline-block;
      background-color: #e6f4ea;
      color: #137333;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .address-box {
      background-color: #f9faf8;
      border: 1px solid #e6e8e5;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
      white-space: pre-wrap;
      color: #1a1a1a;
    }
    .btn-container {
      margin: 16px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #2d4920;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }
    .items-box {
      background-color: #f9faf8;
      border: 1px solid #e6e8e5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .divider {
      height: 1px;
      background-color: #e6e8e5;
      margin: 12px 0;
    }
    .total-row {
      font-size: 16px;
      font-weight: 700;
      color: #2d4920;
    }
    .footer {
      background-color: #f9faf8;
      border-top: 1px solid #e6e8e5;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666666;
    }
    .footer-link {
      color: #2d4920;
      text-decoration: underline;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🚨 New Paid Order Received</h1>
    </div>
    <div class="content">
      <div class="section-title">Order details</div>
      <table class="grid-table">
        <tr class="grid-row">
          <td class="grid-label">Order ID</td>
          <td class="grid-value" style="font-weight: bold;">${updatedOrder.order_id}</td>
        </tr>
        <tr class="grid-row">
          <td class="grid-label">Payment ID</td>
          <td class="grid-value">${updatedOrder.razorpay_payment_id || 'N/A'}</td>
        </tr>
        <tr class="grid-row">
          <td class="grid-label">Payment Status</td>
          <td class="grid-value"><span class="badge">Paid</span></td>
        </tr>
        <tr class="grid-row">
          <td class="grid-label">Timestamp</td>
          <td class="grid-value">${orderTimestamp}</td>
        </tr>
      </table>

      <div class="section-title">Customer Details</div>
      <table class="grid-table">
        <tr class="grid-row">
          <td class="grid-label">Name</td>
          <td class="grid-value">${updatedOrder.customer_name}</td>
        </tr>
        <tr class="grid-row">
          <td class="grid-label">Email</td>
          <td class="grid-value">${email || 'N/A'}</td>
        </tr>
        <tr class="grid-row">
          <td class="grid-label">Phone</td>
          <td class="grid-value">${updatedOrder.customer_phone}</td>
        </tr>
      </table>

      <div class="section-title">Delivery Address</div>
      <div class="address-box">${fullAddress}</div>
      
      ${updatedOrder.maps_link ? `
      <div class="btn-container">
        <a href="${updatedOrder.maps_link}" class="btn" target="_blank" rel="noopener noreferrer">📍 Open Google Maps</a>
      </div>
      ` : ''}

      <div class="section-title">Ordered Items</div>
      <div class="items-box">
        ${itemsListHtml}
        <div class="divider"></div>
        <table style="width: 100%; font-size: 14px; color: #666666;">
          <tr>
            <td style="padding: 4px 0;">Subtotal</td>
            <td style="text-align: right; padding: 4px 0;">₹${updatedOrder.subtotal}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Delivery Fee</td>
            <td style="text-align: right; padding: 4px 0;">₹${updatedOrder.delivery_fee}</td>
          </tr>
          <tr class="total-row">
            <td style="padding: 8px 0 0 0;">Total Paid</td>
            <td style="text-align: right; padding: 8px 0 0 0;">₹${updatedOrder.total}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="footer">
      <a href="https://docs.google.com/spreadsheets/" class="footer-link" target="_blank" rel="noopener noreferrer">Open Google Sheets</a> to begin fulfilment.
    </div>
  </div>
</body>
</html>`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Quartermelon <hello@quartermelon.in>",
            to: [CLIENT_NOTIFICATION_EMAIL],
            subject: `🚨 New Paid Order – ${updatedOrder.order_id}`,
            html: clientHtml,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Resend client email send failed with status ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error("Resend client email exception:", err);
      }
    }
  } else {
    console.error("Resend email notifications skipped: RESEND_API_KEY environment variable is not defined.");
  }

  // ── Return success with internal UUID and human-readable QM-XXXXXX code ─────
  return new Response(
    JSON.stringify({
      success: true,
      order_id: updatedOrder.id,         // internal UUID
      order_code: updatedOrder.order_id, // human-readable QM-XXXXXX
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
