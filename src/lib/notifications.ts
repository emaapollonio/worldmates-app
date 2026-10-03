import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { listPeople, type PeopleRow } from './people';
import { personFullName } from './personDisplay';
import { STRINGS } from '../constants/strings';

type NotificationsModule = typeof import('expo-notifications');

/**
 * expo-notifications je nativni modul: v starejšem dev buildu (brez njega) ali v Expo Go
 * bi navaden `import` ob zagonu zrušil app, zato ga naložimo previdno. Brez modula
 * so vse funkcije no-op, stikala v nastavitvah pa povedo, da opomniki v tem buildu niso na voljo.
 */
let cachedModule: NotificationsModule | null | undefined;
function getNotifications(): NotificationsModule | null {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as NotificationsModule;
  } catch (e) {
    console.warn('[Notifications] expo-notifications ni na voljo v tem buildu:', e);
    cachedModule = null;
  }
  return cachedModule;
}

const BIRTHDAY_CHANNEL_ID = 'birthdays';
const BIRTHDAY_ID_PREFIX = 'birthday:';
const BIRTHDAY_REMINDERS_KEY = 'metmap_birthday_reminders';
/** Opomnik se sproži ob tej uri (lokalni čas). */
const REMINDER_HOUR = 9;
/** iOS dovoli največ 64 načrtovanih lokalnih obvestil; vsaka oseba ima 2 (dan prej + na dan). */
const MAX_BIRTHDAY_PEOPLE = 30;

/** Pokliči enkrat ob zagonu (App.tsx): obvestila se prikažejo tudi, ko je app odprt. */
export function configureNotifications(): void {
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Android 8+ zahteva kanal; ustvarimo ga pred zahtevo za dovoljenje in pred razporejanjem. */
async function ensureChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(BIRTHDAY_CHANNEL_ID, {
    name: STRINGS.notifications.birthdayChannelName,
    importance: N.AndroidImportance.HIGH,
  });
}

async function hasPermission(N: NotificationsModule): Promise<boolean> {
  const perm = await N.getPermissionsAsync();
  return perm.granted;
}

/**
 * Poskrbi za dovoljenje za obvestila ob trenutku, ko ga uporabnik res potrebuje
 * (vklop stikala v nastavitvah) – ne ob zagonu. Vrne true, če je dovoljenje podeljeno.
 * Ob zavrnitvi (ali nedostopnem modulu) pokaže pojasnilo; zavrnitev nikoli ne vrže napake.
 * Za nova stikala za obvestila uporabi isto funkcijo.
 */
export async function requestNotificationPermissionWithExplanation(): Promise<boolean> {
  const N = getNotifications();
  if (!N) {
    Alert.alert(STRINGS.notifications.unavailableTitle, STRINGS.notifications.unavailableMessage);
    return false;
  }
  try {
    await ensureChannel(N);
    let perm = await N.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) {
      perm = await N.requestPermissionsAsync();
    }
    if (perm.granted) return true;
  } catch (e) {
    console.warn('[Notifications] zahteva za dovoljenje ni uspela:', e);
  }
  Alert.alert(STRINGS.notifications.permissionNeededTitle, STRINGS.notifications.permissionNeededMessage, [
    { text: STRINGS.common.cancel, style: 'cancel' },
    {
      text: STRINGS.notifications.openSettings,
      onPress: () => {
        Linking.openSettings().catch((e) => console.warn('[Notifications] openSettings ni uspel:', e));
      },
    },
  ]);
  return false;
}

export async function areBirthdayRemindersEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BIRTHDAY_REMINDERS_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setBirthdayRemindersEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(BIRTHDAY_REMINDERS_KEY, value ? '1' : '0');
}

type BirthdayPerson = Pick<PeopleRow, 'id' | 'first_name' | 'last_name' | 'birthday'>;

function parseBirthday(iso: string | null): { month: number; day: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return { month: m - 1, day: d };
}

/** Koliko dni do naslednjega rojstnega dne (0 = danes) – za izbor najbližjih, ko je obvestil preveč. */
function daysUntilNext({ month, day }: { month: number; day: number }): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month, day);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

const eveId = (personId: string) => `${BIRTHDAY_ID_PREFIX}eve:${personId}`;
const dayId = (personId: string) => `${BIRTHDAY_ID_PREFIX}day:${personId}`;
const personIdOf = (identifier: string) => identifier.split(':').slice(2).join(':');

async function cancelForPerson(N: NotificationsModule, personId: string): Promise<void> {
  await Promise.all([
    N.cancelScheduledNotificationAsync(eveId(personId)),
    N.cancelScheduledNotificationAsync(dayId(personId)),
  ]);
}

/**
 * Letni ponavljajoči (YEARLY) trigger: dan prej in na sam dan ob REMINDER_HOUR.
 * Mesec je po JS konvenciji 0–11. Eve izračunamo na prestopnem letu, da 1. marec → 29. feb.
 */
async function scheduleForPerson(N: NotificationsModule, person: BirthdayPerson): Promise<void> {
  const bd = parseBirthday(person.birthday);
  if (!bd) return;
  const name = person.first_name.trim() || personFullName(person);
  const eve = new Date(2024, bd.month, bd.day - 1);
  const trigger = N.SchedulableTriggerInputTypes.YEARLY;

  await cancelForPerson(N, person.id);
  await N.scheduleNotificationAsync({
    identifier: eveId(person.id),
    content: {
      title: STRINGS.notifications.birthdayTitle,
      body: STRINGS.notifications.birthdayTomorrow(name),
      data: { type: 'birthday', personId: person.id },
    },
    trigger: {
      type: trigger,
      month: eve.getMonth(),
      day: eve.getDate(),
      hour: REMINDER_HOUR,
      minute: 0,
      channelId: BIRTHDAY_CHANNEL_ID,
    },
  });
  await N.scheduleNotificationAsync({
    identifier: dayId(person.id),
    content: {
      title: STRINGS.notifications.birthdayTitle,
      body: STRINGS.notifications.birthdayToday(name),
      data: { type: 'birthday', personId: person.id },
    },
    trigger: {
      type: trigger,
      month: bd.month,
      day: bd.day,
      hour: REMINDER_HOUR,
      minute: 0,
      channelId: BIRTHDAY_CHANNEL_ID,
    },
  });
}

/** Po shranjevanju osebe: prekliče staro in (če so opomniki vklopljeni) razporedi novo obvestilo. */
export async function updateBirthdayRemindersForPerson(person: BirthdayPerson): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await cancelForPerson(N, person.id);
  if (!parseBirthday(person.birthday)) return;
  if (!(await areBirthdayRemindersEnabled()) || !(await hasPermission(N))) return;
  await ensureChannel(N);
  await scheduleForPerson(N, person);
}

/** Ob brisanju osebe. */
export async function cancelBirthdayRemindersForPerson(personId: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await cancelForPerson(N, personId);
}

/** Prekliče vsa rojstnodnevna obvestila (izklop stikala, odjava). */
export async function cancelAllBirthdayReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((s) => s.identifier.startsWith(BIRTHDAY_ID_PREFIX))
      .map((s) => N.cancelScheduledNotificationAsync(s.identifier)),
  );
}

/**
 * Uskladi razporejena obvestila z osebami: kliče se ob zagonu app-a (ko je uporabnik
 * prijavljen) in ob vklopu stikala. Idempotentno – ponovno razporedi vse (YEARLY trigger
 * se sicer sam ponavlja, a tako popravimo tudi izgubljena obvestila in spremembe z drugih naprav).
 */
export async function syncBirthdayReminders(people?: BirthdayPerson[]): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  if (!(await areBirthdayRemindersEnabled()) || !(await hasPermission(N))) {
    await cancelAllBirthdayReminders();
    return;
  }
  await ensureChannel(N);

  const list = people ?? (await listPeople());
  const wanted = list
    .map((p) => ({ person: p, bd: parseBirthday(p.birthday) }))
    .filter((x): x is { person: BirthdayPerson; bd: { month: number; day: number } } => x.bd !== null)
    .sort((a, b) => daysUntilNext(a.bd) - daysUntilNext(b.bd))
    .slice(0, MAX_BIRTHDAY_PEOPLE);
  const wantedIds = new Set(wanted.map((x) => x.person.id));

  const scheduled = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((s) => s.identifier.startsWith(BIRTHDAY_ID_PREFIX) && !wantedIds.has(personIdOf(s.identifier)))
      .map((s) => N.cancelScheduledNotificationAsync(s.identifier)),
  );

  for (const { person } of wanted) {
    await scheduleForPerson(N, person);
  }
}
