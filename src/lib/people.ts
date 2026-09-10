import { supabase } from './supabase';
import type { ContactType, PersonDraft } from '../types/person';

/** Vrstica tabele `people` v Supabase (snake_case, kot v bazi). */
export type PeopleRow = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  contact_type: ContactType;
  contact_value: string | null;
  note: string | null;
  met_date: string | null;
  met_location: string | null;
  tags: string[] | null;
  created_at: string;
};

/** Kar dejansko pošljemo v insert – brez polj, ki jih dodeli baza. */
type PeopleInsert = Omit<PeopleRow, 'id' | 'created_at'>;

function draftToRow(draft: PersonDraft): PeopleInsert {
  return {
    user_id: null, // dokler ni Auth
    first_name: draft.firstName,
    last_name: draft.lastName,
    photo_url: draft.photoUrl,
    country: draft.country,
    city: draft.city,
    latitude: draft.latitude,
    longitude: draft.longitude,
    contact_type: draft.contactType,
    contact_value: draft.contactValue,
    note: draft.note,
    met_date: draft.metDate,
    met_location: draft.metLocation,
    tags: draft.tags,
  };
}

/** Zapiše novo osebo v Supabase in vrne ustvarjeno vrstico. */
export async function insertPerson(draft: PersonDraft): Promise<PeopleRow> {
  const { data, error } = await supabase
    .from('people')
    .insert(draftToRow(draft))
    .select()
    .single();

  if (error) throw error;
  return data as PeopleRow;
}

/** Naloži vse osebe (vsi stolpci), najnovejše najprej. */
export async function listPeople(): Promise<PeopleRow[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PeopleRow[];
}
