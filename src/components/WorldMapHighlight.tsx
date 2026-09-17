import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { RAW_WORLD_MAP_SVG } from '../assets/worldMapSvg';
import { palette } from '../theme/colors';
import { VINTAGE_WATER_COLOR } from '../theme/mapStyle';

type Props = {
  /** Imena držav (glej svgCountryName v src/lib/continents.ts), ki naj bodo obarvane kot "znane". */
  knownCountryNames: Set<string>;
};

/** Vsakemu <path> (glej name=/class= – ISO-kodirane in poimenske države v world.svg) nastavi fill glede na to, ali je njegovo ime med znanimi državami. */
function buildColoredSvg(knownCountryNames: Set<string>): string {
  return RAW_WORLD_MAP_SVG.replace(/<path\b([^>]*?)>/g, (_match, attrs: string) => {
    const nameMatch = /name="([^"]*)"/.exec(attrs) ?? /class="([^"]*)"/.exec(attrs);
    const isKnown = !!nameMatch && knownCountryNames.has(nameMatch[1]);
    const cleanedAttrs = attrs.replace(/\sfill="[^"]*"/, '');
    return `<path${cleanedAttrs} fill="${isKnown ? palette.terracotta : palette.cream}">`;
  });
}

/**
 * Statičen (za zdaj ne-klikljiv) svetovni zemljevid – države, kjer uporabnik
 * pozna vsaj eno osebo, so obarvane terrakota, ostale nevtralno krem, ocean
 * mehko modro-zelen. Vedno v fiksni "vintage" paleti (ne sledi dark mode),
 * kot pravi papirnat zemljevid – enak pristop kot pri VINTAGE_MAP_STYLE za
 * pravi MapView na MapScreen.
 */
export default function WorldMapHighlight({ knownCountryNames }: Props) {
  const xml = useMemo(() => buildColoredSvg(knownCountryNames), [knownCountryNames]);

  return (
    <View style={styles.wrap}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 2000 / 857,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: VINTAGE_WATER_COLOR,
  },
});
