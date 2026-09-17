-- MetMap – tabela `profiles` (uporabnikov profil: ime, avatar, domača država, tagline)
-- + Storage bucket `avatars` za profilne slike.
--
-- Zaženi v Supabase Dashboard → SQL Editor (ali `supabase db push`).
-- Vrstica v profiles se ustvari sama ob prvi prijavi v app (glej ensureProfile
-- v src/lib/profiles.ts, klican iz RootNavigator) – tu ni potreben DB trigger.

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  home_country text,
  tagline      text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_owner_access" on public.profiles;
create policy "profiles_owner_access"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Storage bucket za profilne slike – javno berljiv (kot person-photos), da
-- <Image> nalozi URL neposredno. Pot vsake datoteke je "<uid>/...", zato
-- spodnje politike za pisanje/brisanje preverijo, da prva mapa v poti
-- ustreza prijavljenemu uporabniku.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_write_own" on storage.objects;
create policy "avatars_write_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
