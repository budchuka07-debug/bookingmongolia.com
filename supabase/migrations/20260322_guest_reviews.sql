-- Guest Review System for Booking Mongolia
-- Hotels = property_submissions, Drivers = vehicle_submissions
-- There is no bookings table; verified reviews use review_invites tokens.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

-- ---------------------------------------------------------------------------
-- guest_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NULL,
  booking_ref TEXT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('hotel', 'driver')),
  hotel_id UUID NULL,
  driver_id UUID NULL,
  guest_name TEXT NOT NULL,
  guest_country TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  cleanliness_rating INTEGER NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
  location_rating INTEGER NULL CHECK (location_rating BETWEEN 1 AND 5),
  service_rating INTEGER NULL CHECK (service_rating BETWEEN 1 AND 5),
  comfort_rating INTEGER NULL CHECK (comfort_rating BETWEEN 1 AND 5),
  driving_safety_rating INTEGER NULL CHECK (driving_safety_rating BETWEEN 1 AND 5),
  communication_rating INTEGER NULL CHECK (communication_rating BETWEEN 1 AND 5),
  helpfulness_rating INTEGER NULL CHECK (helpfulness_rating BETWEEN 1 AND 5),
  vehicle_condition_rating INTEGER NULL CHECK (vehicle_condition_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER NULL CHECK (punctuality_rating BETWEEN 1 AND 5),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  invite_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  service_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guest_reviews_target_check CHECK (
    (review_type = 'hotel' AND hotel_id IS NOT NULL AND driver_id IS NULL)
    OR (review_type = 'driver' AND driver_id IS NOT NULL AND hotel_id IS NULL)
  )
);

-- Optional FKs (safe if property/vehicle ids are UUID). Skipped automatically if types differ.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guest_reviews_hotel_id_fkey'
  ) THEN
    ALTER TABLE public.guest_reviews
      ADD CONSTRAINT guest_reviews_hotel_id_fkey
      FOREIGN KEY (hotel_id) REFERENCES public.property_submissions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped hotel_id FK: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guest_reviews_driver_id_fkey'
  ) THEN
    ALTER TABLE public.guest_reviews
      ADD CONSTRAINT guest_reviews_driver_id_fkey
      FOREIGN KEY (driver_id) REFERENCES public.vehicle_submissions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped driver_id FK: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS guest_reviews_hotel_approved_idx
  ON public.guest_reviews (hotel_id, created_at DESC)
  WHERE status = 'approved' AND review_type = 'hotel';

CREATE INDEX IF NOT EXISTS guest_reviews_driver_approved_idx
  ON public.guest_reviews (driver_id, created_at DESC)
  WHERE status = 'approved' AND review_type = 'driver';

CREATE INDEX IF NOT EXISTS guest_reviews_status_idx
  ON public.guest_reviews (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- review_invites (post-booking review links; sets is_verified server-side)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  review_type TEXT NOT NULL CHECK (review_type IN ('hotel', 'driver')),
  hotel_id UUID NULL,
  driver_id UUID NULL,
  guest_name TEXT NULL,
  guest_country TEXT NULL,
  booking_ref TEXT NULL,
  service_date DATE NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_invites_target_check CHECK (
    (review_type = 'hotel' AND hotel_id IS NOT NULL AND driver_id IS NULL)
    OR (review_type = 'driver' AND driver_id IS NOT NULL AND hotel_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS review_invites_token_idx ON public.review_invites (token);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guest_reviews_invite_id_fkey'
  ) THEN
    ALTER TABLE public.guest_reviews
      ADD CONSTRAINT guest_reviews_invite_id_fkey
      FOREIGN KEY (invite_id) REFERENCES public.review_invites(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped invite_id FK: %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_guest_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guest_reviews_updated_at ON public.guest_reviews;
CREATE TRIGGER trg_guest_reviews_updated_at
  BEFORE UPDATE ON public.guest_reviews
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_guest_reviews_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.guest_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved guest reviews" ON public.guest_reviews;
CREATE POLICY "Public can read approved guest reviews"
  ON public.guest_reviews
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- No INSERT/UPDATE/DELETE policies for anon/authenticated.
-- All writes go through Netlify functions with the service role key.
-- Guests cannot publish or self-verify.

COMMENT ON TABLE public.guest_reviews IS
  'Hotel/driver guest reviews. Public read approved only. Inserts via Netlify submit-review.';
COMMENT ON TABLE public.review_invites IS
  'One-time review links for completed Booking Mongolia stays/trips. Marks reviews verified.';
