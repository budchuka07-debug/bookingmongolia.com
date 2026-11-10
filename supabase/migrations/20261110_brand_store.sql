-- Mongolia Brand Store
-- New tables only. This file does not alter travel, hotel, gallery, review, or booking tables.
-- Run it once in the Supabase SQL editor. Until it runs, the store shows no products
-- and seller applications cannot be saved.

create table if not exists public.brand_sellers (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  category text not null,
  product_description text not null,
  website text not null default '',
  facebook text not null default '',
  instagram text not null default '',
  image_urls jsonb not null default '[]'::jsonb,
  production_location text not null,
  made_in_mongolia boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.brand_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.brand_sellers(id) on delete set null,
  slug text not null unique,
  category_slug text not null,
  name text not null,
  description text not null default '',
  price_amount numeric,
  price_currency text not null default 'USD'
    check (price_currency in ('USD', 'MNT', 'EUR', 'JPY', 'KRW')),
  brand_name text not null default '',
  origin text not null default 'Mongolia',
  materials text not null default '',
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  image_urls jsonb not null default '[]'::jsonb,
  stock_status text not null default 'unlisted'
    check (stock_status in ('unlisted', 'in_stock', 'made_to_order', 'out_of_stock')),
  shipping_note text not null default '',
  locale_copy jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.brand_inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.brand_products(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'hidden')),
  created_at timestamptz not null default now()
);

create index if not exists brand_products_published_idx
  on public.brand_products (category_slug, created_at desc)
  where status = 'published';

alter table public.brand_sellers enable row level security;
alter table public.brand_products enable row level security;
alter table public.brand_inquiries enable row level security;

revoke all on table public.brand_sellers from anon, authenticated;
revoke all on table public.brand_products from anon, authenticated;
revoke all on table public.brand_inquiries from anon, authenticated;

grant insert on table public.brand_sellers to anon, authenticated;
grant select on table public.brand_products to anon, authenticated;
grant insert on table public.brand_inquiries to anon, authenticated;

drop policy if exists "Brand sellers can only be submitted as pending" on public.brand_sellers;
create policy "Brand sellers can only be submitted as pending"
  on public.brand_sellers
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and made_in_mongolia = true
    and char_length(brand_name) between 2 and 140
    and char_length(email) between 5 and 160
  );

drop policy if exists "Public reads published brand products" on public.brand_products;
create policy "Public reads published brand products"
  on public.brand_products
  for select
  to anon, authenticated
  using (status = 'published' and origin = 'Mongolia');

drop policy if exists "Brand inquiries can only be submitted as pending" on public.brand_inquiries;
create policy "Brand inquiries can only be submitted as pending"
  on public.brand_inquiries
  for insert
  to anon, authenticated
  with check (status = 'pending' and char_length(message) between 5 and 2000);

create or replace view public.brand_sellers_public
with (security_invoker = false) as
select id, brand_name, category, product_description, production_location, image_urls
from public.brand_sellers
where status = 'approved';

revoke all on table public.brand_sellers_public from anon, authenticated;
grant select on table public.brand_sellers_public to anon, authenticated;

comment on table public.brand_sellers is
  'Mongolia Brand Store seller applications. Public insert stays pending. Contact details are not in the public view.';
comment on table public.brand_products is
  'Mongolia Brand Store products. Public can read published rows only. Admin publishes through the service role.';
