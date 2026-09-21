import type { PersonPrefill } from '../lib/qrShare';
import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Spodnja navigacija (tab bar) – po dizajnu 4 zavihki + sredinski FAB.
 * "AddTab" je samo nosilec za sredinski gumb; ta zavihek se nikoli ne fokusira,
 * gumb namesto tega odpre stack zaslon "AddPerson".
 */
export type TabParamList = {
  Map: undefined;
  List: undefined;
  AddTab: undefined;
  Trips: undefined;
  Profile: undefined;
};

/**
 * Korenski stack – vsebuje tab navigacijo in zaslone, ki se odprejo "čez" (push/modal).
 */
export type RootStackParamList = {
  Auth: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  /** personId prisoten = urejanje obstoječe osebe; odsoten = dodajanje nove. */
  AddPerson: { personId?: string; prefill?: PersonPrefill } | undefined;
  PersonProfile: { personId: string } | undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
