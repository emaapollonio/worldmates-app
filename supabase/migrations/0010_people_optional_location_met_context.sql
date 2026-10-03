-- MetMap – osebo je mogoče shraniti z minimalnim podatkom (brez lokacije)
-- in z dodatnim opisnim poljem ob "Where we met".
-- Zaženi v Supabase Dashboard → SQL Editor.

-- Oseba brez kraja/države nima koordinat → ne pride na zemljevid.
alter table public.people alter column latitude drop not null;
alter table public.people alter column longitude drop not null;

-- Prosto besedilo ob strukturiranem kraju srečanja, npr. "Spain, Erasmus".
alter table public.people add column if not exists met_context text;
