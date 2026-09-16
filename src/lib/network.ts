/**
 * Groba heuristika: ali napaka izgleda kot izpad omrežja (brez interneta),
 * za razliko od npr. napačnih podatkov ali RLS/strežniške napake.
 * React Native-ov fetch pri popolnem izpadu omrežja vrže
 * `TypeError: Network request failed`.
 */
export function isNetworkError(e: unknown): boolean {
  const message =
    e instanceof Error
      ? e.message
      : e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : '';
  return /network request failed|failed to fetch|network error/i.test(message);
}
