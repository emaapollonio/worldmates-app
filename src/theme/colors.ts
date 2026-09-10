/**
 * WorldMates barvna paleta.
 * Topli, potovalni, "zemeljski" toni po vizualnem dizajnu (Stitch screenshoti).
 * Zaenkrat samo barve – tipografija in razmiki pridejo kasneje.
 */
export const colors = {
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
} as const;

export type AppColors = typeof colors;
