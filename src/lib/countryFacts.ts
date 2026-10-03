import countryData from '../data/countryFacts.json';

/**
 * Osnovne zanimivosti o državi (prestolnica, uradni jeziki, valute, zastava) iz lokalnega nabora
 * src/data/countryFacts.json. Nastal je iz paketa `world-countries` (mledoze/countries, ODbL – isti
 * podatki kot REST Countries) s scripts/generate-country-facts.js. Ničesar ne računamo ali ocenjujemo –
 * prikažemo samo to, kar je v naboru.
 *
 * Zakaj lokalno in ne prek REST Countries API: različica v3.1 je ugasnjena (vrača napako), nova v5
 * zahteva API ključ; lokalni nabor deluje brez interneta in ključa, zato predpomnjenje ni potrebno.
 */
export type CountryFacts = {
  name: string;
  capitals: string[];
  languages: string[];
  currencies: { name: string; symbol: string | null }[];
  /** Zastava kot emoji (iz kode države). */
  flag: string;
};

type Entry = {
  cca2: string;
  name: string;
  official: string;
  search: string[];
  capital: string[];
  languages: string[];
  currencies: { name: string; symbol: string | null }[];
  flag: string;
};

/** Za primerjavo imen: male črke, brez diakritik ("Türkiye" = "Turkiye"), strnjeni presledki. */
function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

let index: Map<string, Entry> | null = null;

/** Najprej splošno/uradno ime, nato alternativni zapisi (prvi zapis ima prednost, da "Niger" ne postane Nigerija). */
function getIndex(): Map<string, Entry> {
  if (index) return index;
  const map = new Map<string, Entry>();
  const entries = countryData as Entry[];
  for (const e of entries) {
    map.set(normalize(e.name), e);
    map.set(normalize(e.official), map.get(normalize(e.official)) ?? e);
  }
  for (const e of entries) {
    for (const alt of e.search) {
      const key = normalize(alt);
      if (!map.has(key)) map.set(key, e);
    }
  }
  index = map;
  return map;
}

/** Zanimivosti o državi po imenu (angleško, uradno, alternativni zapis ali slovensko); null, če države ni v naboru. */
export function getCountryFacts(country: string): CountryFacts | null {
  const key = normalize(country);
  if (!key) return null;
  const e = getIndex().get(key);
  if (!e) return null;
  return { name: e.name, capitals: e.capital, languages: e.languages, currencies: e.currencies, flag: e.flag };
}

/**
 * Države osebe, za katere pokažemo kartico: država bivanja in država kraja srečanja
 * (zadnji del oznake "Kraj, Regija, Država", ki jo ustvari izbira predloga). Brez podvajanja.
 */
export function countriesForPerson(person: {
  country: string;
  met_location: string | null;
}): { country: string; role: 'home' | 'met' }[] {
  const result: { country: string; role: 'home' | 'met' }[] = [];
  const home = person.country.trim();
  if (home) result.push({ country: home, role: 'home' });

  const metParts = (person.met_location ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  const met = metParts.length > 0 ? metParts[metParts.length - 1] : '';
  if (met && !result.some((r) => normalize(r.country) === normalize(met))) {
    result.push({ country: met, role: 'met' });
  }
  return result;
}
