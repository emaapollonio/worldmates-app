import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { listPeople, matchesLocation, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';
import SearchBar from '../components/SearchBar';

/** Slovensko sklanjanje "oseba" glede na število (1 oseba, 2 osebi, 3-4 osebe, 5+ oseb). */
function personWord(n: number): string {
  const mod100 = n % 100;
  if (mod100 === 1) return 'oseba';
  if (mod100 === 2) return 'osebi';
  if (mod100 === 3 || mod100 === 4) return 'osebe';
  return 'oseb';
}

export default function TripsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState('');

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPeople();
      if (!signal?.cancelled) setPeople(rows);
    } catch (e) {
      if (!signal?.cancelled) {
        console.error('[TripsScreen] nalaganje ni uspelo:', e);
        setError(e instanceof Error ? e.message : 'Oseb ni bilo mogoče naložiti.');
      }
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const signal = { cancelled: false };
      load(signal);
      return () => {
        signal.cancelled = true;
      };
    }, [load]),
  );

  const trimmedDestination = destination.trim();
  const matches = useMemo(
    () => (trimmedDestination ? people.filter((p) => matchesLocation(p, trimmedDestination)) : []),
    [people, trimmedDestination],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Potovanja</Text>
        <Text style={styles.subtitle}>Vnesi kraj ali državo, ki jo planiraš obiskati.</Text>
        <SearchBar
          value={destination}
          onChangeText={setDestination}
          placeholder="Kam potuješ? (kraj ali država)"
        />
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
      ) : !trimmedDestination ? (
        <View style={styles.centered}>
          <Ionicons name="airplane-outline" size={40} color={colors.textMuted} />
          <Text style={styles.hintText}>
            Vnesi kraj ali državo zgoraj, da vidiš, koga že poznaš tam.
          </Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="sad-outline" size={40} color={colors.textMuted} />
          <Text style={styles.hintText}>Še ne poznaš nikogar tam.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultHeading}>
            V {trimmedDestination} poznaš {matches.length} {personWord(matches.length)}
          </Text>
          <FlatList
            data={matches}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => navigation.navigate('PersonProfile', { personId: item.id })}
              >
                {item.photo_urls?.[0] || item.photo_url ? (
                  <Image source={{ uri: item.photo_urls?.[0] ?? item.photo_url ?? undefined }} style={styles.avatar} />
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -4 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  hintText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  retryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },

  resultHeading: {
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  listContent: { padding: 16, paddingTop: 8 },
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
