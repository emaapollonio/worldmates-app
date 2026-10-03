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

/** Vrste obvestil. Nova vrsta = nov vnos tukaj + v NOTIFICATION_KINDS + vnos v KIND_CONFIG spodaj (+ vrstica v nastavitvah). */
export type NotificationKind = 'birthday' | 'flashback';
export const NOTIFICATION_KINDS: NotificationKind[] = ['birthday', 'flashback'];

const CHANNEL_ID = 'reminders';
/** Opomnik se sproži ob tej uri (lokalni čas). */
const REMINDER_HOUR = 9;
/** Koliko prihodnjih obletnic razporedimo vnaprej (vsaka ima točno besedilo "pred N leti"). */
const FLASHBACK_UPCOMING = 2;
/** iOS dovoli največ 64 načrtovanih lokalnih obvestil – meje po vrstah skupaj ne presežejo 64. Android: brez omejitve. */
const ANDROID_MAX_PEOPLE = 500;

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
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: STRINGS.notifications.channelName,
    importance: N.AndroidImportance.HIGH,
  });
}

async function hasPermission(N: NotificationsModule): Promise<boolean> {
  const perm = await N.getPermissionsAsync();
  return perm.granted;
}

/**
 * Poskrbi za dovoljenje za obvestila ob trenutku, ko ga uporabnik res potrebuje
 * (vklop katerega koli stikala v nastavitvah) – ne ob zagonu. Če je dovoljenje že podeljeno,
 * ne vpraša ničesar. Vrne true, če je dovoljenje podeljeno. Ob zavrnitvi (ali nedostopnem
 * modulu) pokaže pojasnilo; zavrnitev nikoli ne vrže napake.
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

// ---------------------------------------------------------------------------
// Vrste obvestil
// ---------------------------------------------------------------------------

type ReminderPerson = Pick<PeopleRow, 'id' | 'first_name' | 'last_name' | 'birthday' | 'met_date' | 'met_location'>;

type ReminderTrigger =
  | { kind: 'yearly'; month: number; day: number } // month 0–11 (JS konvencija)
  | { kind: 'date'; date: Date };

type ReminderSpec = { key: string; title: string; body: string; trigger: ReminderTrigger };

type KindConfig = {
  /** Ključ v AsyncStorage za stikalo (privzeto izklopljeno = opt-in). */
  storageKey: string;
  /** Največ oseb na iOS (64 obvestil skupaj za vse vrste). */
  iosMaxPeople: number;
  /** Obvestila za osebo; prazen seznam, če oseba nima potrebnih podatkov. */
  specs: (person: ReminderPerson, name: string) => ReminderSpec[];
};

function parseIso(iso: string | null): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

const KIND_CONFIG: Record<NotificationKind, KindConfig> = {
  // Rojstni dan: dan prej in na sam dan, letni ponavljajoči trigger.
  birthday: {
    storageKey: 'metmap_birthday_reminders',
    iosMaxPeople: 16,
    specs: (person, name) => {
      const bd = parseIso(person.birthday);
      if (!bd) return [];
      // Dan prej izračunamo na prestopnem letu, da 1. marec → 29. feb.
      const eve = new Date(2024, bd.month, bd.day - 1);
      const title = STRINGS.notifications.birthdayTitle;
      return [
        {
          key: 'eve',
          title,
          body: STRINGS.notifications.birthdayTomorrow(name),
          trigger: { kind: 'yearly', month: eve.getMonth(), day: eve.getDate() },
        },
        {
          key: 'day',
          title,
          body: STRINGS.notifications.birthdayToday(name),
          trigger: { kind: 'yearly', month: bd.month, day: bd.day },
        },
      ];
    },
  },
  // Flashback: obletnica srečanja (1 leto, 2 leti, …). Besedilo vsebuje število let, zato razporedimo
  // naslednji dve obletnici kot enkratna obvestila (ob vsakem zagonu app-a se dopolnijo).
  flashback: {
    storageKey: 'metmap_flashback_memories',
    iosMaxPeople: 15,
    specs: (person, name) => {
      const met = parseIso(person.met_date);
      if (!met) return [];
      const anniversary = (years: number) => new Date(met.year + years, met.month, met.day, REMINDER_HOUR, 0);
      const now = new Date();
      let years = Math.max(1, now.getFullYear() - met.year);
      while (anniversary(years) <= now) years++;
      const place = person.met_location?.trim() || null;
      const specs: ReminderSpec[] = [];
      for (let i = 0; i < FLASHBACK_UPCOMING; i++) {
        const n = years + i;
        specs.push({
          key: `y${n}`,
          title: STRINGS.notifications.flashbackTitle,
          body: STRINGS.notifications.flashbackBody(name, n, place),
          trigger: { kind: 'date', date: anniversary(n) },
        });
      }
      return specs;
    },
  },
};

export async function getEnabledKinds(): Promise<Record<NotificationKind, boolean>> {
  const result = { birthday: false, flashback: false } as Record<NotificationKind, boolean>;
  await Promise.all(
    NOTIFICATION_KINDS.map(async (kind) => {
      try {
        result[kind] = (await AsyncStorage.getItem(KIND_CONFIG[kind].storageKey)) === '1';
      } catch {
        result[kind] = false;
      }
    }),
  );
  return result;
}

export async function setKindEnabled(kind: NotificationKind, value: boolean): Promise<void> {
  await AsyncStorage.setItem(KIND_CONFIG[kind].storageKey, value ? '1' : '0');
}

// ---------------------------------------------------------------------------
// Razporejanje
// ---------------------------------------------------------------------------

type ScheduledRequest = { identifier: string };

/** Identifikator: `<vrsta>:<ključ>:<personId>` (personId je lahko UUID z vezaji, brez dvopičij). */
const identifierFor = (kind: NotificationKind, key: string, personId: string) => `${kind}:${key}:${personId}`;
const kindOf = (identifier: string) => identifier.split(':')[0];
const personIdOf = (identifier: string) => identifier.split(':').slice(2).join(':');

async function cancelMatching(
  N: NotificationsModule,
  scheduled: ScheduledRequest[],
  predicate: (identifier: string) => boolean,
): Promise<void> {
  await Promise.all(
    scheduled.filter((s) => predicate(s.identifier)).map((s) => N.cancelScheduledNotificationAsync(s.identifier)),
  );
}

const isOurs = (identifier: string) => (NOTIFICATION_KINDS as string[]).includes(kindOf(identifier));

async function scheduleSpecs(
  N: NotificationsModule,
  kind: NotificationKind,
  person: ReminderPerson,
  scheduled: ScheduledRequest[],
): Promise<void> {
  // Najprej prekliči vsa stara obvestila te vrste za osebo (tudi tista z drugimi ključi, npr. pretekla obletnica).
  await cancelMatching(N, scheduled, (id) => kindOf(id) === kind && personIdOf(id) === person.id);
  const name = person.first_name.trim() || personFullName(person);
  for (const spec of KIND_CONFIG[kind].specs(person, name)) {
    await N.scheduleNotificationAsync({
      identifier: identifierFor(kind, spec.key, person.id),
      content: { title: spec.title, body: spec.body, data: { type: kind, personId: person.id } },
      trigger:
        spec.trigger.kind === 'yearly'
          ? {
              type: N.SchedulableTriggerInputTypes.YEARLY,
              month: spec.trigger.month,
              day: spec.trigger.day,
              hour: REMINDER_HOUR,
              minute: 0,
              channelId: CHANNEL_ID,
            }
          : { type: N.SchedulableTriggerInputTypes.DATE, date: spec.trigger.date, channelId: CHANNEL_ID },
    });
  }
}

/** Koliko dni do prvega obvestila osebe (za izbor najbližjih, ko je obvestil preveč). */
function daysToFirst(specs: ReminderSpec[]): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = specs.map((s) => {
    let target: Date;
    if (s.trigger.kind === 'date') target = s.trigger.date;
    else {
      target = new Date(today.getFullYear(), s.trigger.month, s.trigger.day);
      if (target < today) target = new Date(today.getFullYear() + 1, s.trigger.month, s.trigger.day);
    }
    return (target.getTime() - today.getTime()) / 86_400_000;
  });
  return Math.min(...days);
}

/** Vrste, ki so vklopljene, ko je dovoljenje podeljeno (sicer nobena). */
async function activeKinds(N: NotificationsModule): Promise<NotificationKind[]> {
  if (!(await hasPermission(N))) return [];
  const enabled = await getEnabledKinds();
  return NOTIFICATION_KINDS.filter((k) => enabled[k]);
}

/** Po shranjevanju osebe: prekliče stara in (za vklopljene vrste) razporedi nova obvestila. */
export async function updateRemindersForPerson(person: ReminderPerson): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  await cancelMatching(N, scheduled, (id) => isOurs(id) && personIdOf(id) === person.id);
  const kinds = await activeKinds(N);
  if (kinds.length === 0) return;
  await ensureChannel(N);
  for (const kind of kinds) await scheduleSpecs(N, kind, person, []);
}

/** Ob brisanju osebe. */
export async function cancelRemindersForPerson(personId: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  await cancelMatching(N, scheduled, (id) => isOurs(id) && personIdOf(id) === personId);
}

/** Prekliče vsa naša obvestila (odjava). */
export async function cancelAllReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  await cancelMatching(N, scheduled, isOurs);
}

/**
 * Uskladi razporejena obvestila z osebami in stikali: kliče se ob zagonu app-a (prijavljen
 * uporabnik) in ob vsaki spremembi stikala. Idempotentno – izklopljene vrste prekliče, vklopljenim
 * ponovno razporedi obvestila (popravi tudi izgubljena obvestila in dopolni obletnice).
 */
export async function syncAllReminders(people?: ReminderPerson[]): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  const active = await activeKinds(N);
  let scheduled = await N.getAllScheduledNotificationsAsync();
  await cancelMatching(N, scheduled, (id) => isOurs(id) && !(active as string[]).includes(kindOf(id)));
  if (active.length === 0) return;
  await ensureChannel(N);

  const list = people ?? (await listPeople());
  scheduled = await N.getAllScheduledNotificationsAsync();

  for (const kind of active) {
    const cfg = KIND_CONFIG[kind];
    const maxPeople = Platform.OS === 'ios' ? cfg.iosMaxPeople : ANDROID_MAX_PEOPLE;
    const wanted = list
      .map((person) => ({
        person,
        specs: cfg.specs(person, person.first_name.trim() || personFullName(person)),
      }))
      .filter((x) => x.specs.length > 0)
      .sort((a, b) => daysToFirst(a.specs) - daysToFirst(b.specs))
      .slice(0, maxPeople);
    const wantedIds = new Set(wanted.map((x) => x.person.id));

    await cancelMatching(N, scheduled, (id) => kindOf(id) === kind && !wantedIds.has(personIdOf(id)));
    for (const { person } of wanted) await scheduleSpecs(N, kind, person, scheduled);
  }
}
