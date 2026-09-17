import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, FlatList, SectionList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { listPeople, matchesQuery, matchesTags, collectUniqueTags, type PeopleRow } from '../lib/people';
import { getCachedPeople, setCachedPeople } from '../lib/offlineCache';
import { continentForCountry } from '../lib/continents';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';
import SearchBar from '../components/SearchBar';
import TagFilterRow from '../components/TagFilterRow';
import EmptyState from '../components/EmptyState';
import OfflineBanner from '../components/OfflineBanner';
import ContinentIcon from '../components/ContinentIcon';

type SortKey = 'alpha' | 'metDate' | 'country' | 'continent';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'alpha', label: STRINGS.list.sortAlpha },
  { key: 'metDate', label: STRINGS.list.sortMetDate },
  { key: 'country', label: STRINGS.list.sortCountry },
  { key: 'continent', label: STRINGS.list.sortContinent },
];

type ContinentSection = { title: string; data: PeopleRow[] };

/** Skupine po celini (glej continentForCountry), znotraj vsake abecedno po imenu. "Other" vedno zadnji. */
function groupByContinent(people: PeopleRow[]): ContinentSection[] {
  const byContinent = new Map<string, PeopleRow[]>();
  people.forEach((p) => {
    const continent = continentForCountry(p.country);
    const list = byContinent.get(continent);
    if (list) list.push(p);
    else byContinent.set(continent, [p]);
  });

  const continents = Array.from(byContinent.keys()).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  return continents.map((continent) => ({
    title: continent,
    data: [...byContinent.get(continent)!].sort((a, b) => a.first_name.localeCompare(b.first_name, 'sl')),
  }));
}

/** Ena siva "okostna" vrstica – prikazana med prvim nalaganjem namesto spinnerja. */
function SkeletonRow() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, styles.skeletonBlock]} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonBlock, styles.skeletonLineWide]} />
        <View style={[styles.skeletonBlock, styles.skeletonLineNarrow]} />
      </View>
    </View>
  );
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

/** Razvrščanje za navaden (ne-sekcijski) seznam – "continent" se razreši v ListScreen prek groupByContinent. */
function sortPeople(people: PeopleRow[], key: Exclude<SortKey, 'continent'>): PeopleRow[] {
  const sorted = [...people];
  switch (key) {
    case 'alpha':
      sorted.sort((a, b) => a.first_name.localeCompare(b.first_name, 'sl'));
      break;
    case 'metDate':
      // najnovejši najprej; osebe brez datuma srečanja na konec
      sorted.sort((a, b) => {
        if (!a.met_date && !b.met_date) return 0;
        if (!a.met_date) return 1;
        if (!b.met_date) return -1;
        return b.met_date.localeCompare(a.met_date);
      });
      break;
    case 'country':
      sorted.sort((a, b) => a.country.localeCompare(b.country, 'sl'));
      break;
  }
  return sorted;
}

export default function ListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('alpha');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  /**
   * Poskusi naložiti sveže podatke iz Supabase. Ob uspehu posodobi prikaz +
   * cache in izklopi "offline" oznako. Ob neuspehu: če imamo kaj za prikazati
   * (cache ali že prikazano stanje), to obdržimo in samo prikažemo oznako
   * "Offline"; sicer (nič za prikazati) je to prava napaka nalaganja.
   */
  const fetchFresh = useCallback(async (hasFallback: boolean, signal?: { cancelled: boolean }) => {
    try {
      const rows = await listPeople();
      if (signal?.cancelled) return;
      setPeople(rows);
      setError(null);
      setIsOffline(false);
      await setCachedPeople(rows);
    } catch (e) {
      if (signal?.cancelled) return;
      console.error('[ListScreen] nalaganje ni uspelo:', e);
      if (hasFallback) {
        setIsOffline(true);
      } else {
        setError(e instanceof Error ? e.message : STRINGS.common.loadPeopleErrorGeneric);
      }
    }
  }, []);

  const load = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setError(null);
      // Najprej takoj prikaži cache (če obstaja), šele nato poskusi osvežiti.
      const cached = await getCachedPeople();
      if (signal?.cancelled) return;
      if (cached) {
        setPeople(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
      await fetchFresh(cached !== null, signal);
      if (!signal?.cancelled) setLoading(false);
    },
    [fetchFresh],
  );

  /** Pull-to-refresh: ne uporabi `loading` (da skeleton ne prepiše vidnega seznama). */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFresh(people.length > 0);
    setRefreshing(false);
  }, [fetchFresh, people.length]);

  // Naloži ob vsakem fokusu (nova/urejena/izbrisana oseba se takoj pozna).
  useFocusEffect(
    useCallback(() => {
      const signal = { cancelled: false };
      load(signal);
      return () => {
        signal.cancelled = true;
      };
    }, [load]),
  );

  const uniqueTags = useMemo(() => collectUniqueTags(people), [people]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filteredPeople = useMemo(
    () => people.filter((p) => matchesQuery(p, query) && matchesTags(p, selectedTags)),
    [people, query, selectedTags],
  );

  const isByContinent = sortKey === 'continent';
  const visiblePeople = useMemo(
    () => (isByContinent ? filteredPeople : sortPeople(filteredPeople, sortKey)),
    [filteredPeople, sortKey, isByContinent],
  );
  const sections = useMemo(
    () => (isByContinent ? groupByContinent(filteredPeople) : []),
    [filteredPeople, isByContinent],
  );

  const renderPersonRow = ({ item }: { item: PeopleRow }) => (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => navigation.navigate('PersonProfile', { personId: item.id })}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={20} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.rowLocation}>
          {item.city}, {item.country}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );

  const listEmptyComponent =
    people.length === 0 ? (
      <EmptyState
        icon="people-outline"
        title={STRINGS.emptyState.peopleTitle}
        subtitle={STRINGS.emptyState.peopleSubtitle}
        buttonLabel={STRINGS.emptyState.addPersonButton}
        onButtonPress={() => navigation.navigate('AddPerson')}
      />
    ) : (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{STRINGS.list.noFilterResults}</Text>
      </View>
    );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {isOffline ? (
        <View style={styles.offlineBannerWrap}>
          <OfflineBanner />
        </View>
      ) : null}

      <View style={styles.topBar}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      {uniqueTags.length > 0 ? (
        <View style={styles.tagFilterBar}>
          <TagFilterRow tags={uniqueTags} selected={selectedTags} onToggle={toggleTag} />
        </View>
      ) : null}

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>{STRINGS.list.sortLabel}</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = opt.key === sortKey;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setSortKey(opt.key)}
              style={[styles.sortChip, active && styles.sortChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && people.length === 0 ? (
        <View style={styles.listContent}>
          {SKELETON_ROWS.map((i) => (
            <React.Fragment key={i}>
              {i > 0 ? <View style={styles.dashedSeparator} /> : null}
              <SkeletonRow />
            </React.Fragment>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>{STRINGS.common.retry}</Text>
          </Pressable>
        </View>
      ) : isByContinent ? (
        <SectionList
          sections={sections}
          keyExtractor={(p) => p.id}
          stickySectionHeadersEnabled
          contentContainerStyle={[styles.listContent, sections.length === 0 && styles.listContentEmpty]}
          ItemSeparatorComponent={() => <View style={styles.dashedSeparator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={listEmptyComponent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <ContinentIcon continent={section.title} color={colors.primary} size={22} />
              <Text style={styles.sectionHeaderText}>{section.title.toUpperCase()}</Text>
            </View>
          )}
          renderItem={renderPersonRow}
        />
      ) : (
        <FlatList
          data={visiblePeople}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.listContent, visiblePeople.length === 0 && styles.listContentEmpty]}
          ItemSeparatorComponent={() => <View style={styles.dashedSeparator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={listEmptyComponent}
          renderItem={renderPersonRow}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: 16, paddingTop: 12 },
  offlineBannerWrap: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },
  tagFilterBar: { paddingLeft: 16, paddingTop: 10 },

  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sortLabel: { fontSize: 12, color: colors.textMuted, marginRight: 2 },
  sortChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sortChipTextActive: { color: colors.onPrimary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  retryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },

  listContent: { padding: 16, paddingTop: 8 },
  listContentEmpty: { flexGrow: 1 },
  dashedSeparator: {
    height: 1,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.border,
  },

  // Lepljiv (sticky) naslov sekcije celine – neprosojno ozadje, da prekrije vsebino pod sabo med scrollanjem.
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 20,
    letterSpacing: 1.5,
    color: colors.textPrimary,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  rowPressed: { opacity: 0.7 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceMuted },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowName: { fontFamily: FONT_SERIF_BOLD, fontSize: 16, color: colors.textPrimary },
  rowLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  skeletonBlock: { backgroundColor: colors.border },
  skeletonLines: { flex: 1, gap: 8 },
  skeletonLineWide: { height: 14, width: '55%', borderRadius: 4 },
  skeletonLineNarrow: { height: 12, width: '35%', borderRadius: 4 },
});
