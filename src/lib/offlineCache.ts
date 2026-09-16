import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PeopleRow } from './people';

/**
 * Osnoven offline cache za seznam oseb (MapScreen, ListScreen).
 * Namen: ob zagonu zaslona takoj prikazati zadnje znane podatke, medtem ko
 * se v ozadju poskuša naložiti sveže stanje iz Supabase.
 */
const CACHE_KEY = 'cached_people';

/** Vrne shranjene osebe, ali null, če cache (še) ne obstaja / ga ni bilo mogoče prebrati. */
export async function getCachedPeople(): Promise<PeopleRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PeopleRow[];
  } catch (e) {
    console.warn('[offlineCache] branje cache-a ni uspelo:', e);
    return null;
  }
}

/** Shrani trenutni seznam oseb v cache (po vsakem uspešnem nalaganju iz Supabase). */
export async function setCachedPeople(people: PeopleRow[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(people));
  } catch (e) {
    console.warn('[offlineCache] pisanje v cache ni uspelo:', e);
  }
}
