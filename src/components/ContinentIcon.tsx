import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  /** Ime celine, kot ga vrne continentForCountry (src/lib/continents.ts) – npr. "Europe". */
  continent: string;
  color: string;
  size?: number;
};

/**
 * Poenostavljeni, stilizirani obrisi celin (namenoma NISO geografsko
 * natančni) – tanka obrisna črta v barvi teme, v skladu z "vintage stamp"
 * slogom (glej WorldMapSketch v OnboardingScreen za isti pristop). Antarktika
 * je namenoma izpuščena, ker je malo verjetno, da bo kdaj uporabljena.
 */
const CONTINENT_PATHS: Record<string, string> = {
  Europe: 'M30,15 Q45,5 55,15 Q70,10 75,25 Q85,30 78,45 Q82,60 65,65 Q60,80 45,72 Q30,78 28,60 Q15,55 20,40 Q10,30 25,25 Z',
  Asia: 'M10,30 Q30,10 55,15 Q80,8 92,25 Q98,35 90,45 Q95,55 80,58 Q78,75 60,70 Q55,85 45,72 Q35,80 32,65 Q15,60 18,45 Q5,40 10,30 Z',
  Africa: 'M35,8 Q60,5 68,20 Q78,28 72,40 Q75,55 62,60 Q60,75 50,90 Q45,75 40,60 Q25,55 28,40 Q18,28 30,18 Q28,12 35,8 Z',
  'North America':
    'M20,10 Q45,5 65,12 Q85,15 82,30 Q88,40 70,45 Q65,55 50,58 Q48,70 40,80 Q35,68 38,55 Q25,50 28,38 Q12,30 20,10 Z',
  'South America':
    'M45,10 Q60,8 62,20 Q70,30 65,42 Q72,55 60,65 Q62,80 50,92 Q42,80 45,65 Q35,55 40,42 Q30,30 38,20 Q38,12 45,10 Z',
};

const OCEANIA_MAIN = 'M20,50 Q35,35 55,40 Q75,38 78,55 Q82,68 65,72 Q50,80 35,72 Q18,68 20,50 Z';

/** Tanek obris celine za section header na ListScreen; vrne null za neznano/"Other" celino. */
export default function ContinentIcon({ continent, color, size = 22 }: Props) {
  if (continent === 'Oceania') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d={OCEANIA_MAIN} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={82} cy={25} r={5} fill={color} />
        <Circle cx={68} cy={14} r={4} fill={color} />
      </Svg>
    );
  }

  const path = CONTINENT_PATHS[continent];
  if (!path) return null;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={path} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
