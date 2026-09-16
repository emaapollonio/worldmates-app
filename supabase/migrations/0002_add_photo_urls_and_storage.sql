-- MetMap – galerija slik osebe: stolpec photo_urls + Storage bucket.
--
-- Zaženi v Supabase Dashboard → SQL Editor (ali `supabase db push`).
-- `photo_url` (posamezna slika) OSTANE za nazaj združljivost – nove/dodatne
-- slike gredo v `photo_urls` (photo_urls[0] naj bo profilna slika).

alter table public.people
  add column if not exists photo_urls text[];

-- Storage bucket za slike oseb – javno berljiv, da <Image> nalozi URL neposredno.
insert into storage.buckets (id, name, public)
values ('person-photos', 'person-photos', true)
on conflict (id) do nothing;

-- RAZVOJNE politike za storage.objects (isti vzorec kot pri tabeli `people` –
-- anon dostop, ker se ni Auth). Ob koraku z Auth zamenjaj s politikami na
-- osnovi auth.uid() (npr. pot "<uid>/...").
drop policy if exists "dev_person_photos_read" on storage.objects;
create policy "dev_person_photos_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'person-photos');

drop policy if exists "dev_person_photos_write" on storage.objects;
create policy "dev_person_photos_write"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'person-photos');

drop policy if exists "dev_person_photos_delete" on storage.objects;
create policy "dev_person_photos_delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'person-photos');
