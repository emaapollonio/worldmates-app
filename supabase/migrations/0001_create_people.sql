-- WorldMate – tabela `people` (po podatkovnem modelu iz briefa).
--
-- Zaženi na enega od načinov:
--   a) Supabase Dashboard → SQL Editor → prilepi in poženi
--   b) Supabase CLI:  supabase db push
--
-- OPOMBA: RLS politika spodaj je RAZVOJNA (dovoli anon dostop, ker še ni Auth).
-- Ob koraku z Auth jo zamenjaj s politikami na osnovi auth.uid() = user_id.

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- enum za tip kontakta
do $$
begin
  create type public.contact_type as enum ('phone', 'whatsapp', 'instagram', 'telegram', 'email');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.people (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  photo_url     text,
  country       text not null,
  city          text not null,
  latitude      double precision not null,
  longitude     double precision not null,
  contact_type  public.contact_type not null,
  contact_value text,
  note          text,
  met_date      date,
  met_location  text,
  tags          text[],
  created_at    timestamptz not null default now()
);

create index if not exists people_user_id_idx on public.people (user_id);
create index if not exists people_country_city_idx on public.people (country, city);

alter table public.people enable row level security;

-- RAZVOJNA politika – ZAMENJAJ ob uvedbi Auth.
drop policy if exists "dev_people_all_access" on public.people;
create policy "dev_people_all_access"
  on public.people
  for all
  to anon, authenticated
  using (true)
  with check (true);
