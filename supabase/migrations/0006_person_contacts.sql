-- MetMap – podpora za VEČ kontaktov na osebo: nova tabela `person_contacts`
-- namesto enega contact_type/contact_value stolpca na `people`.
--
-- Zaženi v Supabase Dashboard → SQL Editor (ali `supabase db push`).
-- Stara stolpca people.contact_type/contact_value OSTANETA v bazi (za nazaj
-- združljivost in varnost pred izgubo podatkov), a jih aplikacija po tej
-- migraciji ne uporablja več – vsak kontakt gre prek person_contacts.

create table if not exists public.person_contacts (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references public.people (id) on delete cascade,
  contact_type  public.contact_type not null,
  contact_value text not null,
  created_at    timestamptz not null default now()
);

create index if not exists person_contacts_person_id_idx on public.person_contacts (person_id);

alter table public.person_contacts enable row level security;

-- Lastništvo se preverja prek starševske osebe (person_contacts nima svojega
-- user_id) – uporabnik lahko bere/piše kontakte samo za svoje osebe.
drop policy if exists "person_contacts_owner_access" on public.person_contacts;
create policy "person_contacts_owner_access"
  on public.person_contacts
  for all
  to authenticated
  using (exists (select 1 from public.people p where p.id = person_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.people p where p.id = person_id and p.user_id = auth.uid()));

-- people.contact_type je bil "not null" – sprosti ga, ker novo dodane/urejene
-- osebe tega stolpca ne izpolnjujejo več (kontakti gredo v person_contacts).
alter table public.people alter column contact_type drop not null;

-- Migracija obstoječih podatkov: za vsako osebo z izpolnjenim kontaktom
-- ustvari ustrezno vrstico v person_contacts. Pogoj "not exists" naredi
-- skript varen za večkratni zagon (ne podvoji že migriranih vrstic).
insert into public.person_contacts (person_id, contact_type, contact_value)
select p.id, p.contact_type, p.contact_value
from public.people p
where p.contact_value is not null
  and trim(p.contact_value) <> ''
  and not exists (
    select 1 from public.person_contacts pc
    where pc.person_id = p.id
      and pc.contact_type = p.contact_type
      and pc.contact_value = p.contact_value
  );
