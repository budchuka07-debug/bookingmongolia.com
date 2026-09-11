-- Mongolia Gallery: photos + captions stored in Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  photographer_name TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('pending', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_items_published_idx
  ON public.gallery_items (created_at DESC)
  WHERE status = 'published';

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published gallery items" ON public.gallery_items;
CREATE POLICY "Public can read published gallery items"
  ON public.gallery_items
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can insert gallery items" ON public.gallery_items;
CREATE POLICY "Public can insert gallery items"
  ON public.gallery_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status IN ('pending', 'published'));

COMMENT ON TABLE public.gallery_items IS
  'Booking Mongolia gallery photos and captions. Public can insert and read published rows. Hide/delete via admin service role.';
