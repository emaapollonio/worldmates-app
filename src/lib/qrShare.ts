import * as Linking from 'expo-linking';
import type { ContactType } from '../types/person';

/** Podatki, s katerimi se ob odprtju/skeniranju predizpolni obrazec za novo osebo. */
export type PersonPrefill = {
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  contactType?: ContactType;
  contactValue?: string;
};

const ADD_PERSON_PATH = 'add-person';
const MAX_FIELD_LENGTH = 100;
const CONTACT_TYPES: ContactType[] = ['phone', 'whatsapp', 'instagram', 'telegram', 'email'];

/**
 * QR koda vsebuje navaden URL (metmap://add-person?firstName=...), zato ga
 * odpre tudi navadna kamera telefona → app prek deep linka (glej RootNavigator).
 */
export function buildShareUrl(prefill: PersonPrefill): string {
  const queryParams: Record<string, string> = {};
  (Object.entries(prefill) as [string, string | undefined][]).forEach(([key, value]) => {
    if (value && value.trim()) queryParams[key] = value.trim();
  });
  return Linking.createURL(ADD_PERSON_PATH, { queryParams });
}

/** Vrne predizpolnitev, če je URL veljaven "add-person" link, sicer null. Vhod je nezaupljiv – dolžine in tip kontakta se preverijo. */
export function parseShareUrl(url: string): PersonPrefill | null {
  try {
    if (!url.split('?')[0].replace(/\/+$/, '').endsWith(ADD_PERSON_PATH)) return null;
    const params = Linking.parse(url).queryParams ?? {};
    const text = (key: string): string | undefined => {
      const raw = params[key];
      const value = typeof raw === 'string' ? raw.trim().slice(0, MAX_FIELD_LENGTH) : '';
      return value || undefined;
    };

    const prefill: PersonPrefill = {
      firstName: text('firstName'),
      lastName: text('lastName'),
      country: text('country'),
      city: text('city'),
    };
    const contactType = text('contactType') as ContactType | undefined;
    const contactValue = text('contactValue');
    if (contactType && CONTACT_TYPES.includes(contactType) && contactValue) {
      prefill.contactType = contactType;
      prefill.contactValue = contactValue;
    }
    return Object.values(prefill).some(Boolean) ? prefill : null;
  } catch {
    return null;
  }
}
