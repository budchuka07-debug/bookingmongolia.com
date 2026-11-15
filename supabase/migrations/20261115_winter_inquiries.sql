-- Winter tour inquiries. Anon can insert a pending row only.
-- Run once in the Supabase SQL editor. Public pages still accept the
-- Formspree inquiry if this table does not exist yet.

create table if not exists public.winter_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  whatsapp text not null,
  nationality text not null default '',
  travelers integer not null,
  tour_slug text not null,
  departure_date date not null,
  days integer,
  party text not null default '',
  accommodation text not null default '',
  message text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'hidden'))
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'winter_items'
  ) then
    alter table public.winter_items add column if not exists details jsonb;
  end if;
end $$;

alter table public.winter_inquiries enable row level security;

revoke all on table public.winter_inquiries from anon;
revoke all on table public.winter_inquiries from authenticated;

grant insert on table public.winter_inquiries to anon;

drop policy if exists "Winter inquiries can only be submitted as pending" on public.winter_inquiries;
create policy "Winter inquiries can only be submitted as pending"
  on public.winter_inquiries
  for insert
  to anon
  with check (
    status = 'pending'
    and char_length(name) between 2 and 120
    and char_length(email) between 5 and 160
    and position('@' in email) > 1
    and char_length(whatsapp) between 6 and 40
    and char_length(coalesce(nationality, '')) <= 80
    and travelers between 1 and 99
    and tour_slug in (
      'khuvsgul-winter-adventure',
      'khentii-chinggis-khan',
      'central-mongolia-winter',
      'terelj-winter'
    )
    and departure_date is not null
    and (days is null or days between 1 and 30)
    and char_length(coalesce(party, '')) <= 40
    and char_length(coalesce(accommodation, '')) <= 80
    and char_length(coalesce(message, '')) <= 2000
  );

comment on table public.winter_inquiries is
  'Winter tour inquiries. Public insert stays pending. Anon cannot select rows.';
