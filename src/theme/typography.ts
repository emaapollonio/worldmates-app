import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';

/**
 * "Potovalni dnevnik" pisava – serif (Playfair Display) samo za naslove
 * zaslonov in imena oseb; ostalo besedilo ostane v privzeti sans-serif
 * pisavi za berljivost. Glej App.tsx za nalaganje prek useFonts.
 */
export const FONT_SERIF_BOLD = 'PlayfairDisplay_700Bold';

/** Atkinson Hyperlegible (neobvezna "lažje berljiva" pisava, glej FontContext). */
export const FONT_ACCESSIBLE_REGULAR = 'AtkinsonHyperlegible_400Regular';
export const FONT_ACCESSIBLE_ITALIC = 'AtkinsonHyperlegible_400Regular_Italic';
export const FONT_ACCESSIBLE_BOLD = 'AtkinsonHyperlegible_700Bold';
export const FONT_ACCESSIBLE_BOLD_ITALIC = 'AtkinsonHyperlegible_700Bold_Italic';

/**
 * Pri lastni pisavi Android ne izbere samo debele datoteke glede na fontWeight,
 * zato iz sloga razberemo debelino/kurzivo in ročno izberemo ustrezno družino
 * (serif naslovi – FONT_SERIF_BOLD – postanejo Atkinson Bold).
 */
export function withAccessibleFont(style: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = flat.fontWeight;
  const bold =
    flat.fontFamily === FONT_SERIF_BOLD ||
    weight === 'bold' ||
    (weight !== undefined && weight !== 'normal' && Number(weight) >= 600);
  const italic = flat.fontStyle === 'italic';
  const fontFamily = bold
    ? italic
      ? FONT_ACCESSIBLE_BOLD_ITALIC
      : FONT_ACCESSIBLE_BOLD
    : italic
      ? FONT_ACCESSIBLE_ITALIC
      : FONT_ACCESSIBLE_REGULAR;
  return { ...flat, fontFamily, fontWeight: 'normal', fontStyle: 'normal' };
}
