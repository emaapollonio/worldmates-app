/**
 * Iz paketa `world-countries` (podatki projekta mledoze/countries, ODbL – isti podatki, na
 * katerih temelji REST Countries) zgenerira skrčen src/data/countryFacts.json z vsem, kar
 * potrebuje kartica "fun facts": prestolnica, uradni jeziki, valute, zastava (emoji) in imena
 * za iskanje (angleško, uradno, alternativni zapisi, domači in slovenski prevod).
 *
 * Zagon: node scripts/generate-country-facts.js
 */
const fs = require('fs');
const path = require('path');

const countries = require('world-countries');

const out = countries.map((c) => {
  const nativeNames = Object.values(c.name.native ?? {}).flatMap((n) => [n.common, n.official]);
  const slovene = c.translations?.slv ? [c.translations.slv.common, c.translations.slv.official] : [];
  const search = [...new Set([...(c.altSpellings ?? []), ...nativeNames, ...slovene].filter(Boolean))];
  return {
    cca2: c.cca2,
    name: c.name.common,
    official: c.name.official,
    search,
    capital: c.capital ?? [],
    languages: Object.values(c.languages ?? {}),
    currencies: Object.values(c.currencies ?? {}).map((cur) => ({ name: cur.name, symbol: cur.symbol ?? null })),
    flag: c.flag,
  };
});

const target = path.join(__dirname, '..', 'src', 'data', 'countryFacts.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out));
console.log(`Zapisano ${out.length} držav v ${path.relative(process.cwd(), target)} (${fs.statSync(target).size} B)`);
