-- MetMap – rojstni dan osebe (neobvezno), za lokalne opomnike.
-- Poženi ročno v Supabase SQL Editorju.
alter table public.people add column if not exists birthday date;
