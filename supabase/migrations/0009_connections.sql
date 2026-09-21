-- MetMap – povezave med REGISTRIRANIMI uporabniki (ne med "people" zapisi).
-- Zaženi v Supabase Dashboard → SQL Editor (po 0008).
--
-- Uporabnik A (user_id_a) pošlje zahtevo → status 'pending'; uporabnik B
-- (user_id_b) jo potrdi → 'accepted'. Vsak vidi samo svoje povezave.

create table if not exists public.connections (
  id         uuid primary key default gen_random_uuid(),
  user_id_a  uuid not null references auth.users (id) on delete cascade,
  user_id_b  uuid not null references auth.users (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (user_id_a <> user_id_b)
);

-- Ena povezava na par uporabnikov, ne glede na smer.
create unique index if not exists connections_pair_idx
  on public.connections (least(user_id_a, user_id_b), greatest(user_id_a, user_id_b));

alter table public.connections enable row level security;

drop policy if exists "connections_select_own" on public.connections;
create policy "connections_select_own" on public.connections
  for select to authenticated
  using (auth.uid() in (user_id_a, user_id_b));

-- Zahtevo lahko ustvari samo pošiljatelj (A) in samo kot 'pending'.
drop policy if exists "connections_insert_requester" on public.connections;
create policy "connections_insert_requester" on public.connections
  for insert to authenticated
  with check (auth.uid() = user_id_a and status = 'pending');

-- Potrdi jo lahko samo prejemnik (B): pending → accepted.
drop policy if exists "connections_accept_recipient" on public.connections;
create policy "connections_accept_recipient" on public.connections
  for update to authenticated
  using (auth.uid() = user_id_b and status = 'pending')
  with check (auth.uid() = user_id_b and status = 'accepted');

-- Zavrnitev / preklic / odstranitev: katerakoli stran.
drop policy if exists "connections_delete_own" on public.connections;
create policy "connections_delete_own" on public.connections
  for delete to authenticated
  using (auth.uid() in (user_id_a, user_id_b));

-- Kateri uporabniški račun predstavlja ta "person" zapis (če je bil dodan prek QR kode).
alter table public.people
  add column if not exists linked_user_id uuid references auth.users (id) on delete set null;

-- profiles je berljiv samo lastniku, zato drugi uporabniki dobijo samo to, kar smejo,
-- prek teh dveh SECURITY DEFINER funkcij.

-- Trenutna lokacija povezanega uporabnika: samo pri SPREJETI povezavi in če uporabnik deli lokacijo.
create or replace function public.get_connection_location(target uuid)
returns table (current_location text, current_location_updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.current_location, p.current_location_updated_at
  from public.profiles p
  where p.id = target
    and p.share_location
    and p.current_location is not null
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.user_id_a = auth.uid() and c.user_id_b = target)
          or (c.user_id_b = auth.uid() and c.user_id_a = target))
    );
$$;

-- Čakajoče zahteve za trenutnega uporabnika + ime pošiljatelja.
create or replace function public.get_pending_connection_requests()
returns table (connection_id uuid, requester_id uuid, display_name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.id, c.user_id_a, p.display_name, c.created_at
  from public.connections c
  left join public.profiles p on p.id = c.user_id_a
  where c.user_id_b = auth.uid() and c.status = 'pending'
  order by c.created_at desc;
$$;

revoke all on function public.get_connection_location(uuid) from public, anon;
revoke all on function public.get_pending_connection_requests() from public, anon;
grant execute on function public.get_connection_location(uuid) to authenticated;
grant execute on function public.get_pending_connection_requests() to authenticated;
