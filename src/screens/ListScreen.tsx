import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { listPeople, matchesQuery, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';
import SearchBar from '../components/SearchBar';

type SortKey = 'alpha' | 'metDate' | 'country';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'alpha', label: 'Abeceda' },
  { key: 'metDate', label: 'Datum srečanja' },
  { key: 'country', label: 'Država' },
];

function sortPeople(people: PeopleRow[], key: SortKey): PeopleRow[] {
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

  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('alpha');

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPeople();
      if (!signal?.cancelled) setPeople(rows);
    } catch (e) {
      if (!signal?.cancelled) {
        console.error('[ListScreen] nalaganje ni uspelo:', e);
        setError(e instanceof Error ? e.message : 'Oseb ni bilo mogoče naložiti.');
      }
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, []);

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

  const visiblePeople = useMemo(() => {
    const matched = people.filter((p) => matchesQuery(p, query));
    return sortPeople(matched, sortKey);
  }, [people, query, sortKey]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Razvrsti:</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = opt.key === sortKey;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setSortKey(opt.key)}
              style={[styles.sortChip, active && styles.sortChipActive]}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && people.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Poskusi znova</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visiblePeople}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.listContent, visiblePeople.length === 0 && styles.listContentEmpty]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {query ? 'Ni zadetkov za tvoje iskanje.' : 'Nimaš še nobene osebe — dodaj prvo z gumbom +.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
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
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: 16, paddingTop: 12 },

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
  separator: { height: 10 },

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
  rowName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  rowLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
