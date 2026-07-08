-- Migration: add_maps_link_to_orders
-- Adds a maps_link column to the orders table to store the Google Maps
-- navigation link generated per order after geocoding runs.
-- Nullable, no default — populated by the geocode-address Edge Function.

ALTER TABLE orders
  ADD COLUMN maps_link text;
