import { supabase } from './supabase';

/** Vrstica tabele `profiles` v Supabase (snake_case, kot v bazi). */
export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_country: string | null;
  home_city: string | null;
  /** "Mesto, Država" – kje je uporabnik trenutno. */
  current_location: string | null;
  current_location_updated_at: string | null;
  share_location: boolean;
  tagline: string | null;
  created_at: string;
};

export type EditableProfileFields = Partial<
  Pick<ProfileRow, 'display_name' | 'avatar_url' | 'home_country' | 'home_city' | 'tagline' | 'current_location' | 'current_location_updated_at' | 'share_location'>
>;

/** Naloži profil za dani user id. Vrne null, če ne obstaja. */
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

/**
 * Ob prvi prijavi v app za danega uporabnika še ni vrstice v `profiles` –
 * ustvari prazno (samo id) in jo vrne. Če vrstica že obstaja, jo samo vrne.
 */
export async function ensureProfile(userId: string): Promise<ProfileRow> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase.from('profiles').insert({ id: userId }).select().single();
  if (error) throw error;
  return data as ProfileRow;
}

/** Posodobi profil (samo poslana polja) in vrne posodobljeno vrstico. */
export async function updateProfile(userId: string, fields: EditableProfileFields): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').update(fields).eq('id', userId).select().single();
  if (error) throw error;
  return data as ProfileRow;
}
