-- Optional table for the Winter Mongolia admin desk.
-- Run once in the Supabase SQL editor. The public page uses the seed
-- catalog until this table exists and rows are published.

create table if not exists public.winter_items (
  id text primary key,
  kind text not null check (kind in ('tour', 'event')),
  title text not null,
  destination text,
  location text,
  category text,
  summary text,
  highlights jsonb default '[]'::jsonb,
  duration text,
  duration_min integer,
  duration_max integer,
  start_date date,
  end_date date,
  price_label text default 'Request a Quote',
  group_label text,
  availability text default 'on_request',
  image text,
  alt text,
  featured boolean default false,
  published boolean default true,
  sort integer default 0,
  updated_at timestamptz default now()
);

alter table public.winter_items enable row level security;
