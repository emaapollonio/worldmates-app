/**
 * Geokodiranje kraja/države v koordinate prek Nominatim (OpenStreetMap) –
 * brezplačen API, brez ključa. Glej https://nominatim.org/release-docs/latest/api/Search/
 *
 * Nominatim zahteva veljaven User-Agent, ki identificira aplikacijo
 * (uporabniške politike ne dovoljujejo anonimnih/generičnih klicev).
 */
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'WorldMates-App/1.0 (studentska diplomska aplikacija)';

export type GeocodeResult = { latitude: number; longitude: number };

/** Poišče koordinate za "kraj, država". Vrne null, če Nominatim ne najde nič. */
export async function geocodeLocation(city: string, country: string): Promise<GeocodeResult | null> {
  const query = [city, country].filter((part) => part.trim().length > 0).join(', ');
  const url = `${NOMINATIM_SEARCH_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geokodiranje ni uspelo (HTTP ${response.status}).`);
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!results || results.length === 0) return null;

  const latitude = parseFloat(results[0].lat);
  const longitude = parseFloat(results[0].lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}
