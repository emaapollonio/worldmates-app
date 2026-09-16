/**
 * MetMap barvna paleta.
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

/** Nabor barv za avatarje brez fotografije (npr. pini na zemljevidu). */
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
