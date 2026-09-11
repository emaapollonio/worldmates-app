-- WorldMate – lastniško omejen dostop do `people` (po uvedbi Auth).
--
-- !! VRSTNI RED JE POMEMBEN !!
-- 1) Najprej preveri v aplikaciji, da prijava / registracija / odjava delujejo.
-- 2) Registriraj se (ali se prijavi) z računom, ki ga boš uporabljala naprej.
-- 3) Poišči svoj user id:
--      select id, email from auth.users;
-- 4) Obstoječe osebe (dodane pred Auth) imajo user_id = null – ker jih ti
--    ne najdeš). Posodobi jih na svoj user id (SAMO TVOJE, ne tuje!):
--      update public.people
--      set user_id = '<TVOJ-USER-UUID-IZ-KORAKA-3>'
--      where user_id is null;
-- 5) ŠELE NATO zaženi spodnjo politiko. Če jo zaženeš prej (dokler so
--    vrstice še user_id = null), jih po njej ne boš več videla, ker
--    auth.uid() = user_id ne bo nikoli res za null.

drop policy if exists "dev_people_all_access" on public.people;

create policy "people_owner_access"
  on public.people
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
