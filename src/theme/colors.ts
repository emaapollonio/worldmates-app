/**
 * MetMap barvna paleta – svetla in temna varianta.
 * Topli, potovalni, "zemeljski" toni po vizualnem dizajnu (Stitch screenshoti);
 * temna varianta obdrži iste tople odtenke, le ozadje je temnejše in besedilo svetlejše.
 * Glej src/theme/ThemeContext.tsx za preklop glede na sistemsko nastavitev.
 */
export interface AppColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryDark: string;
  onPrimary: string;
  accent: string;
  accentDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  tagBlue: string;
  danger: string;
}

export const lightColors: AppColors = {
  // Podlaga
  background: '#F7F1E7', // kremna podlaga zaslonov
  surface: '#FFFFFF', // kartice
  surfaceMuted: '#F0E8DA', // rahlo obarvane kartice / polja

  // Primarna (terakota / opečnata)
  primary: '#C0562B',
  primaryDark: '#A8481F',
  onPrimary: '#FFFFFF',

  // Akcent (oljčno zelena – npr. značka "Sopotnik", potrjeni gumbi)
  accent: '#5B7551',
  accentDark: '#48603F',

  // Besedilo
  textPrimary: '#3E2C1E', // temno rjava
  textSecondary: '#6F5C48',
  textMuted: '#9B8974',

  // Ostalo
  border: '#E7DCCB',
  tagBlue: '#7FA9C9', // značke tipa "Erasmus"
  danger: '#B23B3B',
};

export const darkColors: AppColors = {
  // Podlaga – topla temno rjava, ne čisto črna
  background: '#1E1712',
  surface: '#2A2019',
  surfaceMuted: '#372A20',

  // Primarna – nekoliko svetlejša/živahnejša terakota za kontrast na temnem ozadju
  primary: '#E07A4E',
  primaryDark: '#C0562B',
  onPrimary: '#241B14',

  // Akcent – svetlejša oljčna
  accent: '#93B57F',
  accentDark: '#6F8E5E',

  // Besedilo – toplo belo/bež namesto čiste bele
  textPrimary: '#F4EADD',
  textSecondary: '#CDB89E',
  textMuted: '#8C7A66',

  // Ostalo
  border: '#4A3B2E',
  tagBlue: '#8FBEDD',
  danger: '#E58080',
};

/** Privzeta (svetla) paleta – za nazaj združljivost tam, kjer tema namenoma ni dinamična (npr. ShareCard). */
export const colors = lightColors;

/** Nabor barv za avatarje brez fotografije (npr. pini na zemljevidu) – enak v obeh temah. */
export const avatarPalette = [
  '#C0562B', // terakota
  '#5B7551', // oljčna
  '#7FA9C9', // modra
  '#B98B4E', // gorčica
  '#8E6C88', // slivova
  '#4C8C86', // petrolej
] as const;

/** Deterministična barva glede na prvo črko imena – ista črka = ista barva. */
export function colorForLetter(letter: string): string {
  const code = letter.trim().toUpperCase().charCodeAt(0);
  if (!code || Number.isNaN(code)) return avatarPalette[0];
  return avatarPalette[code % avatarPalette.length];
}
