// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

// ─── Types (mirroring src/data/bundles.ts) ────────────────────────────────────

/** The three pre-set bundle identifiers. */
type FixedBundleType = "all-juice" | "all-shots" | "all-beverages";

/** One line in the fixed-bundle section of the cart. */
interface FixedBundleLine {
  bundleType: FixedBundleType;
  displayName: string;
  quantity: number;
  /** Fixed unit price in INR. */
  unitPrice: number;
}

/** A single product item inside the custom bundle. */
interface CustomBundleItem {
  slug: string;
  name: string;
  quantity: number;
  /** Per-unit price in INR at time of selection. */
  price: number;
}

/** The "Make Your Own" custom bundle. */
interface CustomBundle {
  items: CustomBundleItem[];
  /** Sum of (item.price x item.quantity) across all items. */
  subtotal: number;
  /** True when subtotal >= 999, which triggers the 10% discount on this bundle. */
  discountUnlocked: boolean;
}

/**
 * The order contents object as shaped in the frontend cart.
 * This is the exact payload received from the frontend at checkout time.
 */
interface OrderContents {
  fixedBundles: FixedBundleLine[];
  customBundle: CustomBundle | null;
}

// ─── Request Body Shape ───────────────────────────────────────────────────────

interface CreateOrderRequestBody {
  /** Customer's full name. */
  customerName: string;
  /** Customer's 10-digit phone number. */
  phone: string;
  /** Primary address line (Flat / House No. / Apartment Name). */
  addressLine1: string;
  /** Secondary address line (Street & Area). */
  addressLine2?: string;
  /** Optional landmark near the delivery address. */
  landmark?: string;
  /** 6-digit Bengaluru pincode. */
  pincode: string;
  /** The cart contents object from the frontend. */
  orderContents: OrderContents;

  // ── Geocoding result (provided by the frontend from the geocode-address preview call) ──
  /** Latitude from geocoding, null if geocoding failed. */
  lat: number | null;
  /** Longitude from geocoding, null if geocoding failed. */
  lng: number | null;
  /** Distance in km from kitchen, null if geocoding failed. */
  distanceKm: number | null;
  /** Delivery fee in INR — always provided (fallback is 150). */
  deliveryFee: number;
  /** Google Maps link, null if geocoding failed. */
  mapsLink: string | null;
  /** "success" or "failed". */
  geocodeStatus: string;

  // ── Pricing (calculated on the frontend, trusted here) ──
  /** Subtotal (items only, before delivery fee). */
  subtotal: number;
  /** Total (subtotal + deliveryFee). */
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a unique order reference following the existing "QM-" prefix
 * pattern already used in the frontend review page.
 *
 * Format: QM-<base36 timestamp, uppercased>
 * Example: QM-LRYSC0T0
 */
function generateOrderId(): string {
  return `QM-${Date.now().toString(36).toUpperCase()}`;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight — must run before any other logic.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests.
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let body: CreateOrderRequestBody;
  try {
    body = (await req.json()) as CreateOrderRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const {
    customerName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    pincode,
    orderContents,
    lat,
    lng,
    distanceKm,
    deliveryFee,
    mapsLink,
    geocodeStatus,
    subtotal,
    total,
  } = body;

  // Basic presence checks.
  if (!customerName || !phone || !addressLine1 || !pincode || !orderContents) {
    return new Response(
      JSON.stringify({
        error:
          "Missing required fields: customerName, phone, addressLine1, pincode, orderContents.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate pricing fields are present.
  if (typeof deliveryFee !== "number" || typeof subtotal !== "number" || typeof total !== "number") {
    return new Response(
      JSON.stringify({
        error: "Missing required pricing fields: deliveryFee, subtotal, total.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Build Supabase service-role client ─────────────────────────────────────
  // We use the service-role key (not anon) because:
  //   - The payments table has zero anon access (RLS with no policies).
  //   - The orders table allows anon INSERT, but updates for error recovery
  //     (setting payment_status to 'failed') require bypassing RLS.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  // ── Read Razorpay credentials from environment ─────────────────────────────
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!razorpayKeyId || !razorpayKeySecret) {
    console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars.");
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Generate order ID and insert the order row.
  //
  // Pricing (subtotal, deliveryFee, total) and geocoding result (lat, lng,
  // distanceKm, geocodeStatus, mapsLink) are all provided by the frontend,
  // which obtained them from the geocode-address preview call in checkout Step 2.
  // ─────────────────────────────────────────────────────────────────────────────
  const orderIdCode = generateOrderId();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_id: orderIdCode,
      customer_name: customerName,
      customer_phone: phone,
      address_line_1: addressLine1,
      address_line_2: addressLine2 ?? null,
      landmark: landmark ?? null,
      pincode,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      order_contents: orderContents,
      lat: lat ?? null,
      lng: lng ?? null,
      distance_km: distanceKm ?? null,
      maps_link: mapsLink ?? null,
      geocode_status: geocodeStatus ?? "pending",
      // payment_status left at DB default ('pending').
      // order_status left at DB default ('new').
    })
    .select("id, order_id")
    .single();

  if (orderError || !orderData) {
    console.error("Failed to insert order:", orderError);
    return new Response(
      JSON.stringify({
        error: "Failed to create order record.",
        detail: orderError?.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const internalOrderId: string = orderData.id as string;

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Create a Razorpay order.
  //
  // Amount is converted from rupees to paise (x 100) as Razorpay requires.
  // If this call fails for any reason, we:
  //   1. Update the order's payment_status to 'failed'.
  //   2. Insert a payment row recording this failed attempt with status 'failed'.
  //   3. Return an error response so the frontend knows not to open the widget.
  // ─────────────────────────────────────────────────────────────────────────────
  const razorpayBasicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
  const amountInPaise = total * 100;

  let razorpayOrderId: string;

  let razorpayResponse: Response;
  try {
    razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${razorpayBasicAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderIdCode,
      }),
    });
  } catch (networkError) {
    const failureReason = `Network error calling Razorpay API: ${String(networkError)}`;
    console.error(failureReason);

    // Update order's payment_status to failed.
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", internalOrderId);

    // Insert a failed payment row with whatever partial information is available.
    await supabase.from("payments").insert({
      order_id: internalOrderId,
      razorpay_order_id: null,
      amount: total,
      status: "failed",
      failure_reason: failureReason,
    });

    return new Response(
      JSON.stringify({
        error: "Failed to reach Razorpay. Please try again.",
        detail: failureReason,
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!razorpayResponse.ok) {
    let razorpayErrorBody = "";
    try {
      razorpayErrorBody = await razorpayResponse.text();
    } catch {
      razorpayErrorBody = "(could not read Razorpay error body)";
    }
    const failureReason = `Razorpay API returned HTTP ${razorpayResponse.status}: ${razorpayErrorBody}`;
    console.error(failureReason);

    // Update order's payment_status to failed.
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", internalOrderId);

    // Insert a failed payment row.
    await supabase.from("payments").insert({
      order_id: internalOrderId,
      razorpay_order_id: null,
      amount: total,
      status: "failed",
      failure_reason: failureReason,
    });

    return new Response(
      JSON.stringify({
        error: "Razorpay order creation failed. Please try again.",
        detail: failureReason,
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse the successful Razorpay response.
  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    razorpayOrder = (await razorpayResponse.json()) as {
      id: string;
      amount: number;
      currency: string;
    };
  } catch (parseError) {
    const failureReason = `Failed to parse Razorpay response: ${String(parseError)}`;
    console.error(failureReason);

    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", internalOrderId);

    await supabase.from("payments").insert({
      order_id: internalOrderId,
      razorpay_order_id: null,
      amount: total,
      status: "failed",
      failure_reason: failureReason,
    });

    return new Response(
      JSON.stringify({
        error: "Unexpected response from Razorpay. Please try again.",
        detail: failureReason,
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  razorpayOrderId = razorpayOrder.id;

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Insert the payment row now that Razorpay has confirmed the order.
  // ─────────────────────────────────────────────────────────────────────────────
  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: internalOrderId,
    razorpay_order_id: razorpayOrderId,
    amount: total,
    status: "created", // Matches the DB default; the widget has not opened yet.
  });

  if (paymentError) {
    // Non-fatal: the Razorpay order exists and can still be completed, but
    // we log the failure and note it for manual reconciliation.
    console.error(
      "Failed to insert payment row (Razorpay order still active):",
      paymentError
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4 — Return everything the frontend needs to launch the Razorpay widget.
  //
  // Included:
  //   - id                : internal UUID (orders.id), for linking subsequent calls
  //   - order_id          : human-readable QM-xxx reference
  //   - razorpay_order_id : Razorpay's own order ID (required by the widget)
  //   - key_id            : Razorpay publishable key (safe to expose to the browser)
  //   - amount            : total in rupees (the widget also needs paise, but the
  //                         frontend can multiply; keeping rupees consistent with
  //                         the rest of the codebase convention)
  //
  // NOT included: payment verification — that is handled by a separate function
  // triggered after the customer completes payment in the widget.
  // ─────────────────────────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      id: internalOrderId,
      order_id: orderIdCode,
      razorpay_order_id: razorpayOrderId,
      key_id: razorpayKeyId,
      amount: total,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
