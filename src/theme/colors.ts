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
  /** Terakota za BESEDILO (povezave, gumbi brez polnila) – temnejša od `primary`, da dosega WCAG AA 4.5:1. */
  primaryText: string;
  onPrimary: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  accentDark: string;
  /** Mustard za BESEDILO (npr. oznake) – temnejši/svetlejši od `accent`, da dosega WCAG AA 4.5:1. */
  accentText: string;
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
  primaryText: '#9A402A', // ~5.4:1 na kremni podlagi (primary #C1553A je dosegel le ~3.7:1)
  onPrimary: '#FFFFFF',

  // Sekundarna (teal – morje/voda na zemljevidu, ločilni poudarki)
  secondary: palette.teal,
  secondaryDark: '#255653',

  // Akcent (mustard/zlata – značke, aktivni tagi)
  accent: palette.mustard,
  accentDark: '#B4842F',
  accentText: '#755510', // accentDark je na kremni podlagi dosegel le ~2.7:1

  // Besedilo
  textPrimary: palette.ink,
  textSecondary: '#6B5A46',
  // Prvotni #9C8B76 je na kremni podlagi dosegel samo ~2.7:1 (pod WCAG AA
  // 4.5:1 za navadno besedilo); #7D6C56 je dosegel ~4.1:1 – zdaj ≥4.7:1 tudi na surfaceMuted.
  textMuted: '#6F5E49',

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
  primaryText: '#E88A6C', // ≥5:1 na vseh temnih podlagah
  onPrimary: '#241A12',

  // Sekundarna – svetlejši teal
  secondary: '#4F928D',
  secondaryDark: palette.teal,

  // Akcent – svetlejši mustard
  accent: '#E6BE6C',
  accentDark: palette.mustard,
  accentText: '#E6BE6C',

  // Besedilo – toplo belo/bež namesto čiste bele
  textPrimary: '#F3E7D3',
  textSecondary: '#CBB596',
  // Prej #8C7A63: ~3.5:1 na surface, ~3.1:1 na surfaceMuted.
  textMuted: '#AE9B82',

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

/** Pretvori "#RRGGBB" v "rgba(r, g, b, alpha)" – za rahlo prosojne, tople poudarke (npr. ozadje tagov). */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
