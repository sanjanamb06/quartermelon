// Setup type definitions for built-in Supabase Runtime APIs
/// <reference path="../deno.d.ts" />
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Kitchen coordinates (Quartermelon HQ). */
const KITCHEN_LAT = 12.9737389;
const KITCHEN_LNG = 77.580944;

/** Delivery fee tiers (rupees). */
const FEE_NEAR = 100;   // ≤ 10 km
const FEE_FAR = 150;    // > 10 km  (also used as geocoding-failure fallback)
const DISTANCE_THRESHOLD_KM = 10;

// ─── Haversine Formula ────────────────────────────────────────────────────────

/**
 * Calculates the straight-line (great-circle) distance in kilometres between
 * two lat/lng coordinate pairs using the Haversine formula.
 * No external library — self-contained calculation.
 */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Request Body Shape ───────────────────────────────────────────────────────

interface GeocodeRequestBody {
  /**
   * Internal UUID from the orders table (orders.id).
   * - If present: database-update mode — geocode + update the orders row.
   * - If absent:  preview mode — geocode + return result, no DB writes.
   */
  orderId?: string;
  /** Primary address line (Flat / House No. / Apartment Name) — required. */
  addressLine1: string;
  /** Secondary address line (Street & Area) — optional. */
  addressLine2?: string;
  /** Nearby landmark — optional. */
  landmark?: string;
  /** 6-digit Bengaluru pincode. */
  pincode: string;
}

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results?: Array<{
    partial_match?: boolean;
    geometry?: {
      location?: { lat: number | string; lng: number | string };
    };
  }>;
}

/** Returns the first finite lat/lng pair found in a Google results array. */
function extractLatLng(
  results: GoogleGeocodeResponse["results"]
): { lat: number; lng: number } | null {
  if (!Array.isArray(results)) return null;

  for (const result of results) {
    const loc = result?.geometry?.location;
    if (loc == null) continue;

    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let body: GeocodeRequestBody;
  try {
    body = (await req.json()) as GeocodeRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { orderId, addressLine1, addressLine2, landmark, pincode } = body;

  // addressLine1 and pincode are always required; orderId is optional.
  if (!addressLine1 || !pincode) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: addressLine1, pincode." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const isPreviewMode = !orderId;

  // ── Read Google Geocoding API key ───────────────────────────────────────────
  const geocodingApiKey = Deno.env.get("GOOGLE_GEOCODING_API_KEY");

  if (!geocodingApiKey) {
    console.error("Missing GOOGLE_GEOCODING_API_KEY env var.");
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Build the combined address string.
  //
  // Join non-empty fields: addressLine1, addressLine2 (if present), landmark
  // (if present), pincode, and the fixed city suffix — comma-space separated.
  // Both addressLine1 and addressLine2 are included since Google will use what
  // it recognizes and gracefully ignore what it doesn't.
  // ─────────────────────────────────────────────────────────────────────────────
  const addressParts: string[] = [addressLine1];
  if (addressLine2?.trim()) addressParts.push(addressLine2.trim());
  if (landmark?.trim()) addressParts.push(landmark.trim());
  addressParts.push(pincode);
  addressParts.push("Bangalore, Karnataka, India");

  const combinedAddress = addressParts.join(", ");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEPS 2-4 — Geocode the address; fall back gracefully on any failure.
  //
  // The entire geocoding block is wrapped in a try-catch so no unhandled error
  // can propagate to the frontend as an HTTP 500.
  // ─────────────────────────────────────────────────────────────────────────────

  let geocodeStatus: "success" | "failed" = "failed";
  let lat: number | null = null;
  let lng: number | null = null;
  let distanceKm: number | null = null;
  let deliveryFee: number = FEE_FAR;
  let mapsLink: string = `https://maps.google.com/?q=${encodeURIComponent(combinedAddress)}`;

  try {
    // STEP 2 — Call the Google Geocoding API.
    const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    geocodeUrl.searchParams.set("address", combinedAddress);
    geocodeUrl.searchParams.set("key", geocodingApiKey);

    const geocodeResponse = await fetch(geocodeUrl.toString());

    if (!geocodeResponse.ok) {
      console.error(
        `Google Geocoding HTTP ${geocodeResponse.status} for pincode ${pincode}.`,
        await geocodeResponse.text().catch(() => "(could not read body)")
      );
    } else {
      const geocodeData = (await geocodeResponse.json()) as GoogleGeocodeResponse;
      const results = geocodeData.results;
      const resultsCount = Array.isArray(results) ? results.length : 0;

      // STEP 3 — Process a successful geocode result.
      // partial_match is intentionally ignored — Google still returns valid coordinates.
      if (geocodeData.status === "OK") {
        const coords = extractLatLng(results);

        if (coords) {
          lat = coords.lat;
          lng = coords.lng;

          distanceKm = haversineKm(KITCHEN_LAT, KITCHEN_LNG, lat, lng);
          deliveryFee = distanceKm <= DISTANCE_THRESHOLD_KM ? FEE_NEAR : FEE_FAR;
          mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
          geocodeStatus = "success";
        } else {
          // STEP 4 — status OK but no usable coordinates in the payload.
          console.error(
            `Geocoding status OK but no extractable coordinates for pincode ${pincode}. ` +
            `resultsCount=${resultsCount}. ` +
            (geocodeData.error_message ?? "No error_message in response.")
          );
        }
      } else {
        // STEP 4 — Geocoding returned a non-OK API status.
        console.error(
          `Geocoding API status "${geocodeData.status}" for pincode ${pincode}. ` +
          (geocodeData.error_message ?? "No error_message in response.")
        );
      }
    }
  } catch (geocodeError) {
    // STEP 4 (fetch/parse threw) — any unexpected error falls through to fallback.
    const errMsg = geocodeError instanceof Error ? geocodeError.message : String(geocodeError);
    console.error(
      `Geocoding threw an unexpected error for address: ${combinedAddress}. ${errMsg}`,
      geocodeError
    );
    // geocodeStatus, deliveryFee, mapsLink already set to fallback values above.
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PREVIEW MODE — Return the geocoding result directly, no database operations.
  //
  // Called from the frontend Step 2 before any order exists in the database.
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPreviewMode) {
    return new Response(
      JSON.stringify({
        lat,
        lng,
        distanceKm,
        deliveryFee,
        mapsLink,
        geocodeStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATABASE-UPDATE MODE — orderId is present; geocode + update the orders row.
  //
  // Reserved for future use (e.g. admin correction of a failed geocoding result).
  // Not currently called from the frontend checkout flow.
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Build Supabase service-role client ──────────────────────────────────────
  // Service role is required: the orders table has no anon UPDATE policy.
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

  // Fetch the existing subtotal so we can recalculate total correctly.
  const { data: orderRow, error: fetchError } = await supabase
    .from("orders")
    .select("subtotal")
    .eq("id", orderId)
    .single();

  if (fetchError || !orderRow) {
    console.error("Failed to fetch order row for subtotal:", fetchError);
    return new Response(
      JSON.stringify({ error: "Order not found.", detail: fetchError?.message }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const subtotal: number = orderRow.subtotal as number;
  const total = subtotal + deliveryFee;

  // Build the update payload based on geocoding outcome.
  const updatePayload =
    geocodeStatus === "success"
      ? {
          lat,
          lng,
          distance_km: distanceKm,
          geocode_status: "success" as const,
          delivery_fee: deliveryFee,
          maps_link: mapsLink,
          total,
        }
      : {
          lat: null,
          lng: null,
          distance_km: null,
          geocode_status: "failed" as const,
          delivery_fee: deliveryFee,
          maps_link: mapsLink,
          total,
        };

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateError) {
    console.error("Failed to update order with geocoding results:", updateError);
    return new Response(
      JSON.stringify({
        error: "Failed to update order with geocoding results.",
        detail: updateError.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Return the result in the same shape as preview mode for consistency.
  return new Response(
    JSON.stringify({
      lat,
      lng,
      distanceKm,
      deliveryFee,
      mapsLink,
      geocodeStatus,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
