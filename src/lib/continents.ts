/**
 * Groba preslikava država → celina + ime na world.svg (glej
 * src/assets/worldMapSvg.ts / WorldMapHighlight), za statistiko na profilu,
 * section headerje v ListScreen ("po celini") in barvanje sveta na profilu.
 * Ne shranjujemo tega neposredno (ni stolpca v bazi), zato ga izpeljemo iz
 * besedila v `country` – uporabnik ga vpiše prosto, zato podpiramo tako
 * slovenska kot angleška imena najpogostejših držav. Neznana država pade v
 * "Other" (celina) / brez ujemanja na zemljevidu (svgCountryName).
 */
type CountryInfo = {
  continent: string;
  /** Natančno ime, kot ga uporablja world.svg (name= ali class= na <path>) – undefined, če je država premajhna za ta poenostavljen zemljevid (npr. Singapur). */
  svgName?: string;
};

const COUNTRY_INFO: Record<string, CountryInfo> = {
  // Evropa
  slovenija: { continent: 'Europe', svgName: 'Slovenia' },
  slovenia: { continent: 'Europe', svgName: 'Slovenia' },
  italija: { continent: 'Europe', svgName: 'Italy' },
  italy: { continent: 'Europe', svgName: 'Italy' },
  hrvaska: { continent: 'Europe', svgName: 'Croatia' },
  hrvaška: { continent: 'Europe', svgName: 'Croatia' },
  croatia: { continent: 'Europe', svgName: 'Croatia' },
  avstrija: { continent: 'Europe', svgName: 'Austria' },
  austria: { continent: 'Europe', svgName: 'Austria' },
  nemcija: { continent: 'Europe', svgName: 'Germany' },
  nemčija: { continent: 'Europe', svgName: 'Germany' },
  germany: { continent: 'Europe', svgName: 'Germany' },
  francija: { continent: 'Europe', svgName: 'France' },
  france: { continent: 'Europe', svgName: 'France' },
  spanija: { continent: 'Europe', svgName: 'Spain' },
  španija: { continent: 'Europe', svgName: 'Spain' },
  spain: { continent: 'Europe', svgName: 'Spain' },
  portugalska: { continent: 'Europe', svgName: 'Portugal' },
  portugal: { continent: 'Europe', svgName: 'Portugal' },
  svica: { continent: 'Europe', svgName: 'Switzerland' },
  švica: { continent: 'Europe', svgName: 'Switzerland' },
  switzerland: { continent: 'Europe', svgName: 'Switzerland' },
  'velika britanija': { continent: 'Europe', svgName: 'United Kingdom' },
  'zdruzeno kraljestvo': { continent: 'Europe', svgName: 'United Kingdom' },
  'združeno kraljestvo': { continent: 'Europe', svgName: 'United Kingdom' },
  'united kingdom': { continent: 'Europe', svgName: 'United Kingdom' },
  uk: { continent: 'Europe', svgName: 'United Kingdom' },
  england: { continent: 'Europe', svgName: 'United Kingdom' },
  irska: { continent: 'Europe', svgName: 'Ireland' },
  ireland: { continent: 'Europe', svgName: 'Ireland' },
  nizozemska: { continent: 'Europe', svgName: 'Netherlands' },
  netherlands: { continent: 'Europe', svgName: 'Netherlands' },
  belgija: { continent: 'Europe', svgName: 'Belgium' },
  belgium: { continent: 'Europe', svgName: 'Belgium' },
  poljska: { continent: 'Europe', svgName: 'Poland' },
  poland: { continent: 'Europe', svgName: 'Poland' },
  ceska: { continent: 'Europe', svgName: 'Czech Republic' },
  češka: { continent: 'Europe', svgName: 'Czech Republic' },
  czechia: { continent: 'Europe', svgName: 'Czech Republic' },
  'czech republic': { continent: 'Europe', svgName: 'Czech Republic' },
  slovaska: { continent: 'Europe', svgName: 'Slovakia' },
  slovaška: { continent: 'Europe', svgName: 'Slovakia' },
  slovakia: { continent: 'Europe', svgName: 'Slovakia' },
  madzarska: { continent: 'Europe', svgName: 'Hungary' },
  madžarska: { continent: 'Europe', svgName: 'Hungary' },
  hungary: { continent: 'Europe', svgName: 'Hungary' },
  grcija: { continent: 'Europe', svgName: 'Greece' },
  grčija: { continent: 'Europe', svgName: 'Greece' },
  greece: { continent: 'Europe', svgName: 'Greece' },
  svedska: { continent: 'Europe', svgName: 'Sweden' },
  švedska: { continent: 'Europe', svgName: 'Sweden' },
  sweden: { continent: 'Europe', svgName: 'Sweden' },
  norveska: { continent: 'Europe', svgName: 'Norway' },
  norveška: { continent: 'Europe', svgName: 'Norway' },
  norway: { continent: 'Europe', svgName: 'Norway' },
  danska: { continent: 'Europe', svgName: 'Denmark' },
  denmark: { continent: 'Europe', svgName: 'Denmark' },
  finska: { continent: 'Europe', svgName: 'Finland' },
  finland: { continent: 'Europe', svgName: 'Finland' },
  islandija: { continent: 'Europe', svgName: 'Iceland' },
  iceland: { continent: 'Europe', svgName: 'Iceland' },
  romunija: { continent: 'Europe', svgName: 'Romania' },
  romania: { continent: 'Europe', svgName: 'Romania' },
  bolgarija: { continent: 'Europe', svgName: 'Bulgaria' },
  bulgaria: { continent: 'Europe', svgName: 'Bulgaria' },
  srbija: { continent: 'Europe', svgName: 'Serbia' },
  serbia: { continent: 'Europe', svgName: 'Serbia' },
  bosna: { continent: 'Europe', svgName: 'Bosnia and Herzegovina' },
  'bosna in hercegovina': { continent: 'Europe', svgName: 'Bosnia and Herzegovina' },
  'crna gora': { continent: 'Europe', svgName: 'Montenegro' },
  montenegro: { continent: 'Europe', svgName: 'Montenegro' },
  'severna makedonija': { continent: 'Europe', svgName: 'Macedonia' },
  albanija: { continent: 'Europe', svgName: 'Albania' },
  albania: { continent: 'Europe', svgName: 'Albania' },
  ukrajina: { continent: 'Europe', svgName: 'Ukraine' },
  ukraine: { continent: 'Europe', svgName: 'Ukraine' },
  rusija: { continent: 'Europe', svgName: 'Russian Federation' },
  russia: { continent: 'Europe', svgName: 'Russian Federation' },

  // Azija
  turcija: { continent: 'Asia', svgName: 'Turkey' },
  turčija: { continent: 'Asia', svgName: 'Turkey' },
  turkey: { continent: 'Asia', svgName: 'Turkey' },
  kitajska: { continent: 'Asia', svgName: 'China' },
  china: { continent: 'Asia', svgName: 'China' },
  japonska: { continent: 'Asia', svgName: 'Japan' },
  japan: { continent: 'Asia', svgName: 'Japan' },
  indija: { continent: 'Asia', svgName: 'India' },
  india: { continent: 'Asia', svgName: 'India' },
  tajska: { continent: 'Asia', svgName: 'Thailand' },
  thailand: { continent: 'Asia', svgName: 'Thailand' },
  vietnam: { continent: 'Asia', svgName: 'Vietnam' },
  indonezija: { continent: 'Asia', svgName: 'Indonesia' },
  indonesia: { continent: 'Asia', svgName: 'Indonesia' },
  filipini: { continent: 'Asia', svgName: 'Philippines' },
  philippines: { continent: 'Asia', svgName: 'Philippines' },
  malezija: { continent: 'Asia', svgName: 'Malaysia' },
  malaysia: { continent: 'Asia', svgName: 'Malaysia' },
  // Singapur je premajhen za ta poenostavljen zemljevid – brez svgName (ni ga med <path>-i).
  singapur: { continent: 'Asia' },
  singapore: { continent: 'Asia' },
  'juzna koreja': { continent: 'Asia', svgName: 'Republic of Korea' },
  'južna koreja': { continent: 'Asia', svgName: 'Republic of Korea' },
  'south korea': { continent: 'Asia', svgName: 'Republic of Korea' },
  izrael: { continent: 'Asia', svgName: 'Israel' },
  israel: { continent: 'Asia', svgName: 'Israel' },
  nepal: { continent: 'Asia', svgName: 'Nepal' },

  // Severna Amerika
  zda: { continent: 'North America', svgName: 'United States' },
  'united states': { continent: 'North America', svgName: 'United States' },
  usa: { continent: 'North America', svgName: 'United States' },
  kanada: { continent: 'North America', svgName: 'Canada' },
  canada: { continent: 'North America', svgName: 'Canada' },
  mehika: { continent: 'North America', svgName: 'Mexico' },
  mexico: { continent: 'North America', svgName: 'Mexico' },
  kostarika: { continent: 'North America', svgName: 'Costa Rica' },
  'costa rica': { continent: 'North America', svgName: 'Costa Rica' },

  // Južna Amerika
  argentina: { continent: 'South America', svgName: 'Argentina' },
  brazilija: { continent: 'South America', svgName: 'Brazil' },
  brazil: { continent: 'South America', svgName: 'Brazil' },
  cile: { continent: 'South America', svgName: 'Chile' },
  čile: { continent: 'South America', svgName: 'Chile' },
  chile: { continent: 'South America', svgName: 'Chile' },
  kolumbija: { continent: 'South America', svgName: 'Colombia' },
  colombia: { continent: 'South America', svgName: 'Colombia' },
  peru: { continent: 'South America', svgName: 'Peru' },
  urugvaj: { continent: 'South America', svgName: 'Uruguay' },
  uruguay: { continent: 'South America', svgName: 'Uruguay' },
  ekvador: { continent: 'South America', svgName: 'Ecuador' },
  ecuador: { continent: 'South America', svgName: 'Ecuador' },
  bolivija: { continent: 'South America', svgName: 'Bolivia' },
  bolivia: { continent: 'South America', svgName: 'Bolivia' },
  venezuela: { continent: 'South America', svgName: 'Venezuela' },

  // Afrika
  egipt: { continent: 'Africa', svgName: 'Egypt' },
  egypt: { continent: 'Africa', svgName: 'Egypt' },
  maroko: { continent: 'Africa', svgName: 'Morocco' },
  morocco: { continent: 'Africa', svgName: 'Morocco' },
  'juzna afrika': { continent: 'Africa', svgName: 'South Africa' },
  'južna afrika': { continent: 'Africa', svgName: 'South Africa' },
  'south africa': { continent: 'Africa', svgName: 'South Africa' },
  kenija: { continent: 'Africa', svgName: 'Kenya' },
  kenya: { continent: 'Africa', svgName: 'Kenya' },
  tanzanija: { continent: 'Africa', svgName: 'Tanzania' },
  tanzania: { continent: 'Africa', svgName: 'Tanzania' },
  tunizija: { continent: 'Africa', svgName: 'Tunisia' },
  tunisia: { continent: 'Africa', svgName: 'Tunisia' },

  // Oceanija
  avstralija: { continent: 'Oceania', svgName: 'Australia' },
  australia: { continent: 'Oceania', svgName: 'Australia' },
  'nova zelandija': { continent: 'Oceania', svgName: 'New Zealand' },
  'new zealand': { continent: 'Oceania', svgName: 'New Zealand' },
};

/**
 * Poenoti zapis imena države za primerjavo/združevanje: trim, lowercase,
 * Unicode NFC normalizacija (isti znak "š" lahko pride kot en kodni znak ali
 * kot "s" + kombinirajoči diakritik – brez normalizacije bi bili to različna
 * niza) in strnjeni presledki (npr. "United  Kingdom" -> "united kingdom").
 * Uporabljata jo tako continentForCountry/svgCountryName spodaj kot
 * computeStats/computeCountryCounts v src/lib/people.ts, da je "ista država"
 * definirana na enem mestu.
 */
export function normalizeCountryName(country: string): string {
  return country.trim().toLowerCase().normalize('NFC').replace(/\s+/g, ' ');
}

/** Vrne celino za dano državo (po imenu, brez upoštevanja velikih/malih črk). */
export function continentForCountry(country: string): string {
  return COUNTRY_INFO[normalizeCountryName(country)]?.continent ?? 'Other';
}

/** Ime države, kot ga uporablja world.svg (glej WorldMapHighlight) – undefined, če ni ujemanja. */
export function svgCountryName(country: string): string | undefined {
  return COUNTRY_INFO[normalizeCountryName(country)]?.svgName;
}
