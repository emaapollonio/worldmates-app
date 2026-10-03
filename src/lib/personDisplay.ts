import { STRINGS } from '../constants/strings';

/** Ime za prikaz – osebo je mogoče shraniti brez imena, zato rezerva namesto praznega niza. */
export function personFullName(p: { first_name: string; last_name: string }): string {
  return `${p.first_name} ${p.last_name}`.trim() || STRINGS.common.unnamedPerson;
}

/** "Mesto, Država" – izpusti manjkajoče dele; prazen niz, če kraja ni. */
export function personPlace(p: { city: string; country: string }): string {
  return [p.city, p.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}
