-- Mongolia Brand Store ger specifications.
-- Run this file once in the Supabase SQL editor.
-- It adds columns only. Travel, hotel, gallery, and booking tables are left unchanged.
-- Until it runs, public pages keep the local ger catalog, and specification edits from Admin cannot be stored.

alter table public.brand_products
  add column if not exists specs jsonb not null default '{}'::jsonb;

alter table public.brand_inquiries
  add column if not exists product_slug text not null default '';

comment on column public.brand_products.specs is
  'Optional weights, package dimensions, production time, and customization notes. Unknown values stay "To be confirmed" or "Available upon request". Shipping is not part of the price.';

comment on column public.brand_inquiries.product_slug is
  'Product slug submitted with a quotation request. product_id may be null when the request comes from the local ger catalog.';
