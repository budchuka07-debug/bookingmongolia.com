-- Booking Mongolia — General Travel Agreement acceptances
-- Bookings themselves still go through Formspree / Netlify Forms.
-- This table stores electronic checkbox acceptance only (no duplicate booking records).
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS public.booking_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  traveler_name TEXT NOT NULL,
  traveler_email TEXT NULL,
  traveler_contact TEXT NULL,
  service_type TEXT NULL,
  selected_tour TEXT NULL,
  agreement_accepted BOOLEAN NOT NULL DEFAULT true,
  agreement_version TEXT NOT NULL DEFAULT '2026',
  agreement_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NULL DEFAULT 'tours-dates',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_agreement_acceptances_accepted_check CHECK (agreement_accepted = true),
  CONSTRAINT booking_agreement_acceptances_booking_id_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS booking_agreement_acceptances_accepted_at_idx
  ON public.booking_agreement_acceptances (agreement_accepted_at DESC);

ALTER TABLE public.booking_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- No public policies: reads/writes only via service role (Netlify Functions / admin).

COMMENT ON TABLE public.booking_agreement_acceptances IS
  'Electronic acceptance of BookingMongolia General Travel Agreement (versioned PDF).';
