/**
 * MetMap barvna paleta – "vintage travel stamp" stil, svetla in temna varianta.
 * Krem/terakota/teal/mustard toni po vzoru starih potnih žigov in razglednic;
 * temna varianta obdrži iste poudarke, le ozadje je espresso rjavo (ne črno).
 * Glej src/theme/ThemeContext.tsx za preklop glede na sistemsko nastavitev.
 */
export interface AppColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryDark: string;
  onPrimary: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  accentDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  tagBlue: string;
  danger: string;
}

/**
 * Osnovni poimenovani toni "vintage travel stamp" palete (glej palette.cream,
 * palette.terracotta, palette.teal, palette.mustard, palette.ink v opisu naloge).
 * Poimenovano `palette`, ne `colors`, ker je `colors` spodaj že zasedeno ime
 * za privzeto (svetlo) resolved temo – iz te palete izhajata lightColors in darkColors.
 */
export const palette = {
  cream: '#F1E6D2',
  sand: '#DFD0B4',
  terracotta: '#C1553A',
  teal: '#2F6E6A',
  mustard: '#D9A441',
  ink: '#3A2E1F',
  espresso: '#241A12',
} as const;

export const lightColors: AppColors = {
  // Podlaga
  background: palette.cream,
  surface: '#FBF6EA', // topla bela (namesto čiste bele) za kartice
  surfaceMuted: '#EADFC5',

  // Primarna (terakota – žig/pečat)
  primary: palette.terracotta,
  primaryDark: '#A2432C',
  onPrimary: '#FFFFFF',

  // Sekundarna (teal – morje/voda na zemljevidu, ločilni poudarki)
  secondary: palette.teal,
  secondaryDark: '#255653',

  // Akcent (mustard/zlata – značke, aktivni tagi)
  accent: palette.mustard,
  accentDark: '#B4842F',

  // Besedilo
  textPrimary: palette.ink,
  textSecondary: '#6B5A46',
  textMuted: '#9C8B76',

  // Ostalo
  border: palette.sand,
  tagBlue: '#7FA9C9', // značke tipa "Erasmus"
  danger: '#B23B3B',
};

export const darkColors: AppColors = {
  // Podlaga – espresso rjava, ne čisto črna
  background: palette.espresso,
  surface: '#33271A',
  surfaceMuted: '#402F1F',

  // Primarna – nekoliko svetlejša/živahnejša terakota za kontrast na temnem ozadju
  primary: '#E07858',
  primaryDark: palette.terracotta,
  onPrimary: '#241A12',

  // Sekundarna – svetlejši teal
  secondary: '#4F928D',
  secondaryDark: palette.teal,

  // Akcent – svetlejši mustard
  accent: '#E6BE6C',
  accentDark: palette.mustard,

  // Besedilo – toplo belo/bež namesto čiste bele
  textPrimary: '#F3E7D3',
  textSecondary: '#CBB596',
  textMuted: '#8C7A63',

  // Ostalo
  border: '#4A3A28',
  tagBlue: '#8FBEDD',
  danger: '#E58080',
};

/** Privzeta (svetla) paleta – za nazaj združljivost tam, kjer tema namenoma ni dinamična (npr. ShareCard). */
export const colors = lightColors;

/** Nabor barv za avatarje brez fotografije (npr. pini na zemljevidu) – enak v obeh temah. */
export const avatarPalette = [
  palette.terracotta,
  palette.teal,
  palette.mustard,
  '#5B7551', // oljčna
  '#8E6C88', // slivova
  '#4C6E8C', // prašno modra
] as const;

/** Deterministična barva glede na prvo črko imena – ista črka = ista barva. */
export function colorForLetter(letter: string): string {
  const code = letter.trim().toUpperCase().charCodeAt(0);
  if (!code || Number.isNaN(code)) return avatarPalette[0];
  return avatarPalette[code % avatarPalette.length];
}
