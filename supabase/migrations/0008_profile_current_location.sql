-- MetMap – "Trenutno sem v..." na profilu.
-- Zaženi v Supabase Dashboard → SQL Editor.
alter table public.profiles add column if not exists current_location text;
alter table public.profiles add column if not exists current_location_updated_at timestamptz;
-- Ali sme uporabnik svojo trenutno lokacijo pokazati sprejetim povezavam (glej connections).
alter table public.profiles add column if not exists share_location boolean not null default true;
