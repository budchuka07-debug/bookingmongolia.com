-- Fix guest review target IDs: property/vehicle/guide submissions use
-- integer (or mixed) primary keys, not UUID. Storing "29" into a UUID
-- column caused: invalid input syntax for type uuid: "29"
--
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

-- Drop UUID FKs if they were created (safe if absent)
ALTER TABLE public.guest_reviews DROP CONSTRAINT IF EXISTS guest_reviews_hotel_id_fkey;
ALTER TABLE public.guest_reviews DROP CONSTRAINT IF EXISTS guest_reviews_driver_id_fkey;
ALTER TABLE public.review_invites DROP CONSTRAINT IF EXISTS review_invites_hotel_id_fkey;
ALTER TABLE public.review_invites DROP CONSTRAINT IF EXISTS review_invites_driver_id_fkey;

-- Widen target id columns to TEXT (keeps existing UUID rows via ::text)
ALTER TABLE public.guest_reviews
  ALTER COLUMN hotel_id TYPE TEXT USING hotel_id::text;
ALTER TABLE public.guest_reviews
  ALTER COLUMN driver_id TYPE TEXT USING driver_id::text;

ALTER TABLE public.review_invites
  ALTER COLUMN hotel_id TYPE TEXT USING hotel_id::text;
ALTER TABLE public.review_invites
  ALTER COLUMN driver_id TYPE TEXT USING driver_id::text;

-- Guide reviews
ALTER TABLE public.guest_reviews
  ADD COLUMN IF NOT EXISTS guide_id TEXT NULL;
ALTER TABLE public.review_invites
  ADD COLUMN IF NOT EXISTS guide_id TEXT NULL;

-- Expand review_type checks to include guide
ALTER TABLE public.guest_reviews DROP CONSTRAINT IF EXISTS guest_reviews_review_type_check;
ALTER TABLE public.guest_reviews
  ADD CONSTRAINT guest_reviews_review_type_check
  CHECK (review_type IN ('hotel', 'driver', 'guide'));

ALTER TABLE public.review_invites DROP CONSTRAINT IF EXISTS review_invites_review_type_check;
ALTER TABLE public.review_invites
  ADD CONSTRAINT review_invites_review_type_check
  CHECK (review_type IN ('hotel', 'driver', 'guide'));

ALTER TABLE public.guest_reviews DROP CONSTRAINT IF EXISTS guest_reviews_target_check;
ALTER TABLE public.guest_reviews
  ADD CONSTRAINT guest_reviews_target_check CHECK (
    (review_type = 'hotel' AND hotel_id IS NOT NULL AND driver_id IS NULL AND guide_id IS NULL)
    OR (review_type = 'driver' AND driver_id IS NOT NULL AND hotel_id IS NULL AND guide_id IS NULL)
    OR (review_type = 'guide' AND guide_id IS NOT NULL AND hotel_id IS NULL AND driver_id IS NULL)
  );

ALTER TABLE public.review_invites DROP CONSTRAINT IF EXISTS review_invites_target_check;
ALTER TABLE public.review_invites
  ADD CONSTRAINT review_invites_target_check CHECK (
    (review_type = 'hotel' AND hotel_id IS NOT NULL AND driver_id IS NULL AND guide_id IS NULL)
    OR (review_type = 'driver' AND driver_id IS NOT NULL AND hotel_id IS NULL AND guide_id IS NULL)
    OR (review_type = 'guide' AND guide_id IS NOT NULL AND hotel_id IS NULL AND driver_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS guest_reviews_guide_approved_idx
  ON public.guest_reviews (guide_id, created_at DESC)
  WHERE status = 'approved' AND review_type = 'guide';

COMMENT ON COLUMN public.guest_reviews.hotel_id IS 'property_submissions.id as text';
COMMENT ON COLUMN public.guest_reviews.driver_id IS 'vehicle_submissions.id as text';
COMMENT ON COLUMN public.guest_reviews.guide_id IS 'guide_submissions.id as text';
