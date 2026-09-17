/**
 * Podatkovni model osebe (po tehničnem briefu).
 */

export type ContactType = 'phone' | 'whatsapp' | 'instagram' | 'telegram' | 'email';

/** En kontakt osebe (glej public.person_contacts) – oseba jih ima lahko poljubno mnogo, tudi nič. */
export type PersonContact = {
  type: ContactType;
  value: string;
};

export interface Person {
  id: string;
  /** uporabnik, ki je osebo dodal */
  userId: string;
  firstName: string;
  lastName: string;
  /** @deprecated obdrzano za nazaj zdruzljivost – uporabi photoUrls[0] */
  photoUrl: string | null;
  /** Vse fotografije osebe (Supabase Storage javni URL-ji). Prva = profilna. */
  photoUrls: string[] | null;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  contacts: PersonContact[];
  note: string | null;
  /** ISO datum (YYYY-MM-DD) */
  metDate: string | null;
  /** kraj srečanja, če se razlikuje od kraja bivanja */
  metLocation: string | null;
  /** koordinati kraja srečanja (geokodirani iz metLocation) – null, dokler ni izpolnjen/geokodiran */
  metLatitude: number | null;
  metLongitude: number | null;
  /** npr. "hostel", "sopotnik", "lokalec" */
  tags: string[] | null;
  /** ISO timestamp */
  createdAt: string;
}

/**
 * Nov vnos iz obrazca – brez polj, ki jih dodeli baza:
 * `id` (gen_random_uuid), `userId` (auth.uid, ko dodamo Auth), `createdAt` (default now()).
 */
export type PersonDraft = Omit<Person, 'id' | 'userId' | 'createdAt'>;
