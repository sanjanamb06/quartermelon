-- Create payments table to model Razorpay payment lifecycle
create table payments (
  id                  uuid        primary key default gen_random_uuid(),

  -- Reference to the order this payment belongs to.
  -- No ON DELETE CASCADE: payment records must never be silently removed
  -- as a side effect of an order being deleted.
  order_id            uuid        not null references orders(id),

  -- Razorpay order ID, populated at insert time once the flow calls
  -- Razorpay before creating this row.
  razorpay_order_id   text,

  -- Razorpay payment ID, populated after the customer completes payment
  -- in the checkout widget.
  razorpay_payment_id text,

  -- Payment amount in rupees, matching the unit convention used in the
  -- orders table pricing columns.
  amount              integer     not null,

  -- Payment lifecycle status using Razorpay's own terminology.
  status              text        not null default 'created'
                                  check (status in ('created', 'authorized', 'captured', 'failed', 'refunded')),

  -- Razorpay error description when a payment fails.
  failure_reason      text,

  -- Tracks partial or full refund amounts in rupees; defaults to zero.
  refunded_amount     integer     not null default 0,

  created_at          timestamptz not null default now()
);

-- Enable Row Level Security.
-- No policies are added: all reads and writes to this table must go
-- through Edge Functions using service-role privileges. The anon role
-- has zero direct access in any direction.
alter table payments enable row level security;
