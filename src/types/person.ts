/**
 * Podatkovni model osebe (po tehničnem briefu).
 */

export type ContactType = 'phone' | 'whatsapp' | 'instagram' | 'telegram' | 'email';

export interface Person {
  id: string;
  /** uporabnik, ki je osebo dodal */
  userId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  contactType: ContactType;
  contactValue: string | null;
  note: string | null;
  /** ISO datum (YYYY-MM-DD) */
  metDate: string | null;
  /** kraj srečanja, če se razlikuje od kraja bivanja */
  metLocation: string | null;
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
