-- MetMap – domače mesto uporabnika (za "Moja QR koda" na profilu).
-- Zaženi v Supabase Dashboard → SQL Editor.
alter table public.profiles add column if not exists home_city text;
