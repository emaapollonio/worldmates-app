/**
 * Geokodiranje in iskanje krajev prek Nominatim (OpenStreetMap) – brezplačen
 * API, brez ključa. Glej https://nominatim.org/release-docs/latest/api/Search/
 *
 * Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
 * največ 1 zahtevek/sekundo (spodaj vsi klici tečejo skozi eno vrsto z
 * minimalnim razmikom) in User-Agent, ki identificira aplikacijo.
 */
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MetMap-App/1.0 (studentska diplomska aplikacija)';
const MIN_REQUEST_GAP_MS = 1100;

export type GeocodeResult = { latitude: number; longitude: number };

/** En predlog iz Nominatim iskanja – koordinate so TOČNO tiste, ki jih je vrnil Nominatim za ta zadetek. */
export type PlaceSuggestion = {
  id: string;
  /** Ime kraja (mesto/vas/ime lokacije), brez regije in države. */
  name: string;
  region: string | null;
  country: string | null;
  /** Za prikaz v seznamu: "Izola, Slovenia" oz. "Portorož, Piran, Slovenia". */
  label: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string>;
};

let requestChain: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Zaporedno izvaja zahtevke z vsaj MIN_REQUEST_GAP_MS razmika; preklican (aborted) zahtevek se preskoči. */
function rateLimited<T>(signal: AbortSignal | undefined, run: () => Promise<T>): Promise<T | null> {
  const next = requestChain.then(async () => {
    const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    if (signal?.aborted) return null;
    lastRequestAt = Date.now();
    return run();
  });
  requestChain = next.catch(() => undefined);
  return next;
}

async function nominatimSearch(params: Record<string, string>, signal?: AbortSignal): Promise<NominatimResult[] | null> {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  return rateLimited(signal, async () => {
    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${qs}`, {
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Geokodiranje ni uspelo (HTTP ${response.status}).`);
    return (await response.json()) as NominatimResult[];
  });
}

function toSuggestion(r: NominatimResult): PlaceSuggestion | null {
  const latitude = parseFloat(r.lat);
  const longitude = parseFloat(r.lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  const a = r.address ?? {};
  const name =
    r.name || a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || r.display_name.split(',')[0].trim();
  const region = a.state || a.county || a.region || null;
  const country = a.country || null;
  const label = [name, region && region !== name ? region : null, country].filter(Boolean).join(', ');

  return { id: String(r.place_id), name, region, country, label, latitude, longitude };
}

/**
 * Predlogi za avtodopolnjevanje (največ 5) med tipkanjem. `settlementsOnly`
 * omeji zadetke na naselja (mesta/vasi) – za polje "kraj", da zadetek ni npr.
 * zaliv ali morje.
 */
export async function searchPlaces(
  query: string,
  options: { settlementsOnly?: boolean; signal?: AbortSignal } = {},
): Promise<PlaceSuggestion[]> {
  const params: Record<string, string> = {
    format: 'jsonv2',
    limit: '5',
    addressdetails: '1',
    'accept-language': 'en',
    q: query,
  };
  if (options.settlementsOnly) params.featureType = 'settlement';

  const results = await nominatimSearch(params, options.signal);
  if (!results) return [];
  return results.map(toSuggestion).filter((s): s is PlaceSuggestion => s !== null);
}

/**
 * Rezerva, ko uporabnik ni izbral predloga s seznama: najprej strukturirana
 * poizvedba (city= + country=, natančnejša od proste fraze), nato prosta
 * fraza. Vrne null, če Nominatim ne najde nič.
 */
export async function geocodeLocation(city: string, country: string): Promise<GeocodeResult | null> {
  const base = { format: 'jsonv2', limit: '1', 'accept-language': 'en' };

  if (city.trim() && country.trim()) {
    const structured = await nominatimSearch({ ...base, city: city.trim(), country: country.trim() });
    const hit = structured?.[0] && toSuggestion(structured[0]);
    if (hit) return { latitude: hit.latitude, longitude: hit.longitude };
  }

  const query = [city, country].filter((part) => part.trim().length > 0).join(', ');
  const free = await nominatimSearch({ ...base, q: query });
  const hit = free?.[0] && toSuggestion(free[0]);
  return hit ? { latitude: hit.latitude, longitude: hit.longitude } : null;
}
