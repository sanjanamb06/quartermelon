-- Migration: create_orders_table
-- Creates the orders table for Quartermelon with RLS enabled.
-- Anon role may INSERT only; reads, updates, and deletes go through
-- Edge Functions or the Supabase dashboard.

CREATE TABLE orders (
  -- Primary key
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable order reference (e.g. QM-A1B2C3)
  order_id            text NOT NULL UNIQUE,

  -- Customer & delivery details
  customer_name       text NOT NULL,
  customer_phone      text NOT NULL,
  address_line_1      text NOT NULL,
  address_line_2      text,                          -- optional
  landmark            text,                          -- optional
  pincode             text NOT NULL,

  -- Geocoding results (nullable — geocoding can fail)
  lat                 double precision,
  lng                 double precision,
  distance_km         double precision,
  geocode_status      text NOT NULL DEFAULT 'failed'
                        CHECK (geocode_status IN ('success', 'failed')),

  -- Pricing (integer rupees, no paise)
  delivery_fee        integer NOT NULL,
  subtotal            integer NOT NULL,
  total               integer NOT NULL,
  discount_applied    boolean NOT NULL DEFAULT false,

  -- Cart contents — mirrors the frontend cart shape:
  --   { fixedBundles: [...], customBundle: { ... } }
  order_contents      jsonb NOT NULL,

  -- Payment tracking (populated after payment attempt begins)
  razorpay_order_id   text,
  razorpay_payment_id text,
  payment_status      text NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending', 'paid', 'failed')),

  -- Order lifecycle
  order_status        text NOT NULL DEFAULT 'new'
                        CHECK (order_status IN ('new', 'packed', 'out_for_delivery', 'delivered')),
  delivery_date       date,                          -- reserved for Mon/Thu scheduling logic

  -- Audit
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow the anon role to INSERT new orders.
-- SELECT / UPDATE / DELETE from the browser are intentionally blocked;
-- those operations must go through Edge Functions (service-role key) or
-- the Supabase dashboard.
CREATE POLICY "anon_insert_orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);
