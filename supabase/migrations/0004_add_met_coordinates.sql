-- MetMap – koordinate kraja srečanja (za preklop "Kje smo se spoznali" na zemljevidu).
--
-- Zaženi v Supabase Dashboard → SQL Editor (ali `supabase db push`).

alter table public.people
  add column if not exists met_latitude double precision,
  add column if not exists met_longitude double precision;
