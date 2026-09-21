import { STRINGS } from '../constants/strings';

/** "updated today / yesterday / N days ago" iz ISO timestampa. Vrne null, če datum ni veljaven. */
export function updatedAgoLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
  return STRINGS.profile.updatedDaysAgo(days);
}
