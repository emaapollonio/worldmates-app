import { supabase } from './supabase';
import type { ContactType, PersonContact, PersonDraft } from '../types/person';
import { continentForCountry, normalizeCountryName } from './continents';

/** Vrstica tabele `person_contacts` v Supabase (snake_case, kot v bazi). */
export type PersonContactRow = {
  id: string;
  person_id: string;
  contact_type: ContactType;
  contact_value: string;
  created_at: string;
};

/** Vrstica tabele `people` v Supabase (snake_case, kot v bazi). */
export type PeopleRow = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  /** @deprecated obdrzano za nazaj zdruzljivost – uporabi photo_urls[0] */
  photo_url: string | null;
  photo_urls: string[] | null;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  /** @deprecated osebe od uvedbe person_contacts ne pišejo več v ta stolpca – uporabi person_contacts */
  contact_type: ContactType | null;
  /** @deprecated glej contact_type */
  contact_value: string | null;
  note: string | null;
  met_date: string | null;
  met_location: string | null;
  /** koordinati kraja srečanja, geokodirani iz met_location; null, dokler ni na voljo */
  met_latitude: number | null;
  met_longitude: number | null;
  tags: string[] | null;
  created_at: string;
  /** Vsi kontakti osebe (public.person_contacts, naloženi z embedded select). */
  person_contacts: PersonContactRow[];
};

/** Kar dejansko pošljemo v insert – brez polj, ki jih dodeli baza/insertPerson, in brez person_contacts (ločena tabela). */
type PeopleInsert = Omit<PeopleRow, 'id' | 'created_at' | 'user_id' | 'person_contacts'>;

/** Polja, ki jih obrazec za urejanje sme spremeniti – brez user_id (lastništvo se ne spreminja). */
export type EditablePersonFields = PeopleInsert;

function draftToRow(draft: PersonDraft): PeopleInsert {
  return {
    first_name: draft.firstName,
    last_name: draft.lastName,
    photo_url: draft.photoUrl,
    photo_urls: draft.photoUrls,
    country: draft.country,
    city: draft.city,
    latitude: draft.latitude,
    longitude: draft.longitude,
    // Kontakti gredo v person_contacts (glej replaceContactsForPerson) – ta stolpca sta ukinjena.
    contact_type: null,
    contact_value: null,
    note: draft.note,
    met_date: draft.metDate,
    met_location: draft.metLocation,
    met_latitude: draft.metLatitude,
    met_longitude: draft.metLongitude,
    tags: draft.tags,
  };
}

/**
 * Nadomesti VSE kontakte osebe z danim seznamom (izbriše obstoječe, nato
 * vstavi novega) – preprost "replace all" namesto ročnega diff-anja, ker
 * kontakti nimajo lastne identitete, ki bi jo bilo treba ohranjati med
 * urejanji. Prazen seznam samo izbriše obstoječe kontakte.
 */
async function replaceContactsForPerson(personId: string, contacts: PersonContact[]): Promise<PersonContactRow[]> {
  const { error: deleteError } = await supabase.from('person_contacts').delete().eq('person_id', personId);
  if (deleteError) throw deleteError;

  if (contacts.length === 0) return [];

  const { data, error } = await supabase
    .from('person_contacts')
    .insert(contacts.map((c) => ({ person_id: personId, contact_type: c.type, contact_value: c.value })))
    .select();
  if (error) throw error;
  return (data ?? []) as PersonContactRow[];
}

/** Zapiše novo osebo (z lastnikom = trenutni prijavljeni uporabnik) + njene kontakte in vrne vrstico. */
export async function insertPerson(draft: PersonDraft): Promise<PeopleRow> {
  const { data: authData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('people')
    .insert({ ...draftToRow(draft), user_id: authData.user?.id ?? null })
    .select()
    .single();

  if (error) throw error;

  const contacts = await replaceContactsForPerson(data.id, draft.contacts);
  return { ...(data as PeopleRow), person_contacts: contacts };
}

/** Posodobi obstoječo osebo (brez spreminjanja user_id) + nadomesti njene kontakte in vrne posodobljeno vrstico. */
export async function updatePerson(
  id: string,
  fields: EditablePersonFields,
  contacts: PersonContact[],
): Promise<PeopleRow> {
  const { data, error } = await supabase.from('people').update(fields).eq('id', id).select().single();
  if (error) throw error;

  const contactRows = await replaceContactsForPerson(id, contacts);
  return { ...(data as PeopleRow), person_contacts: contactRows };
}

/**
 * Naloži vse osebe (vsi stolpci + kontakti) trenutnega uporabnika, najnovejše
 * najprej. Eksplicitno filtrira po user_id (poleg RLS na strani baze) – tako
 * statistika/seznami ne morejo prikazati tujih vrstic, tudi če bi bila RLS
 * politika kdaj napačno nastavljena.
 */
export async function listPeople(): Promise<PeopleRow[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  let query = supabase.from('people').select('*, person_contacts(*)').order('created_at', { ascending: false });
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PeopleRow[];
}

/** Naloži eno osebo (+ njene kontakte) po id. Vrne null, če je ni. */
export async function getPerson(id: string): Promise<PeopleRow | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*, person_contacts(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as PeopleRow | null) ?? null;
}

/** Izbriše osebo po id. */
export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Ali oseba ustreza iskalnemu nizu (case-insensitive, "vsebuje").
 * Uporablja se na ListScreen in MapScreen, da je logika iskanja enotna.
 */
export function matchesQuery(person: PeopleRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    person.first_name.toLowerCase().includes(q) ||
    person.last_name.toLowerCase().includes(q) ||
    person.country.toLowerCase().includes(q) ||
    person.city.toLowerCase().includes(q)
  );
}

/** Ali ima oseba vsaj enega od izbranih tagov. Prazna izbira = ujema vsem. */
export function matchesTags(person: PeopleRow, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) return true;
  const personTags = person.tags ?? [];
  return selectedTags.some((tag) => personTags.includes(tag));
}

/** Vsi unikatni tagi med osebami, abecedno urejeni. */
export function collectUniqueTags(people: PeopleRow[]): string[] {
  const set = new Set<string>();
  people.forEach((p) => (p.tags ?? []).forEach((tag) => set.add(tag)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'sl'));
}

/**
 * Vsi unikatni tagi, ki jih je uporabnik kadarkoli uporabil na kateri koli
 * svoji osebi – za predloge ob dodajanju/urejanju osebe (glej
 * AddPersonScreen). Naloži samo stolpec `tags` (array), ne celih vrstic, in
 * ga na strani odjemalca sesuje v en unikaten seznam (ekvivalent
 * "select distinct unnest(tags)" – Postgres text[] pride iz PostgREST že kot
 * navadno JS polje na vsaki vrstici, zato ni potreben SQL unnest).
 * Eksplicitno filtrira po user_id (kot listPeople) namesto da se zanese
 * samo na RLS.
 */
export async function listAllTags(): Promise<string[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  let query = supabase.from('people').select('tags');
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const set = new Set<string>();
  (data ?? []).forEach((row) => {
    (row.tags as string[] | null)?.forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed) set.add(trimmed);
    });
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'sl'));
}

/**
 * Ali oseba živi v kraju/državi, ki ustreza iskalnemu nizu (case-insensitive, "vsebuje").
 * Za razliko od matchesQuery NE preverja imena – uporablja se za "Potovanja".
 */
export function matchesLocation(person: PeopleRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return person.country.toLowerCase().includes(q) || person.city.toLowerCase().includes(q);
}

export type PeopleStats = {
  totalPeople: number;
  countryCount: number;
  continentCount: number;
};

/** Statistika za profil: št. oseb, unikatnih držav in (grobo ocenjenih) celin. */
export function computeStats(people: PeopleRow[]): PeopleStats {
  const countries = new Set(people.map((p) => normalizeCountryName(p.country)));
  const continents = new Set(people.map((p) => continentForCountry(p.country)));
  return {
    totalPeople: people.length,
    countryCount: countries.size,
    continentCount: continents.size,
  };
}

export type CountryCount = { country: string; count: number };

/**
 * Št. oseb na državo (združevanje prek normalizeCountryName, prikazno ime =
 * prvič vpisan zapis) – za "zbirko žigov" na profilu. Urejeno padajoče po
 * številu.
 */
export function computeCountryCounts(people: PeopleRow[]): CountryCount[] {
  const byKey = new Map<string, CountryCount>();
  people.forEach((p) => {
    const country = p.country.trim();
    if (!country) return;
    const key = normalizeCountryName(country);
    const existing = byKey.get(key);
    if (existing) existing.count += 1;
    else byKey.set(key, { country, count: 1 });
  });
  return Array.from(byKey.values()).sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}
