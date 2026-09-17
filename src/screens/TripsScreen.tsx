import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, FlatList, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { listPeople, matchesLocation, computeCountryCounts, type PeopleRow } from '../lib/people';
import { continentForCountry } from '../lib/continents';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';
import SearchBar from '../components/SearchBar';
import ContinentIcon from '../components/ContinentIcon';

type ContinentCountries = { continent: string; countries: string[] };

/** Vse (unikatne) države, kjer uporabnik pozna vsaj eno osebo, združene po celini – za mrežo pilul na TripsScreen. */
function groupCountriesByContinent(people: PeopleRow[]): ContinentCountries[] {
  const byContinent = new Map<string, string[]>();
  computeCountryCounts(people).forEach(({ country }) => {
    const continent = continentForCountry(country);
    const list = byContinent.get(continent);
    if (list) list.push(country);
    else byContinent.set(continent, [country]);
  });

  const continents = Array.from(byContinent.keys()).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  return continents.map((continent) => ({
    continent,
    countries: [...byContinent.get(continent)!].sort((a, b) => a.localeCompare(b, 'sl')),
  }));
}

/** Slovensko sklanjanje "oseba" glede na število (1 oseba, 2 osebi, 3-4 osebe, 5+ oseb). */
function personWord(n: number): string {
  const mod100 = n % 100;
  if (mod100 === 1) return STRINGS.trips.personWordSingular;
  if (mod100 === 2) return STRINGS.trips.personWordDual;
  if (mod100 === 3 || mod100 === 4) return STRINGS.trips.personWordFew;
  return STRINGS.trips.personWordMany;
}

export default function TripsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        setError(e instanceof Error ? e.message : STRINGS.common.loadPeopleErrorGeneric);
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
  const countriesByContinent = useMemo(() => groupCountriesByContinent(people), [people]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>{STRINGS.trips.title}</Text>
        <Text style={styles.subtitle}>{STRINGS.trips.subtitle}</Text>
        <SearchBar value={destination} onChangeText={setDestination} placeholder={STRINGS.trips.searchPlaceholder} />
      </View>

      {loading && people.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>{STRINGS.common.retry}</Text>
          </Pressable>
        </View>
      ) : !trimmedDestination ? (
        <ScrollView contentContainerStyle={styles.promptContent}>
          <View style={styles.promptHero}>
            <Ionicons name="airplane-outline" size={40} color={colors.textMuted} />
            <Text style={styles.hintText}>{STRINGS.trips.promptHint}</Text>
          </View>

          {countriesByContinent.length > 0 ? (
            <View style={styles.countriesSection}>
              <Text style={styles.countriesGridTitle}>{STRINGS.trips.countriesGridTitle}</Text>
              {countriesByContinent.map(({ continent, countries }) => (
                <View key={continent} style={styles.continentGroup}>
                  <View style={styles.continentLabelRow}>
                    <ContinentIcon continent={continent} color={colors.primary} size={16} />
                    <Text style={styles.continentLabel}>{continent.toUpperCase()}</Text>
                  </View>
                  <View style={styles.countryChipGrid}>
                    {countries.map((country) => (
                      <Pressable
                        key={country}
                        style={styles.countryChip}
                        onPress={() => setDestination(country)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.countryChipText}>{country}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : matches.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="sad-outline" size={40} color={colors.textMuted} />
          <Text style={styles.hintText}>{STRINGS.trips.noMatches}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultHeading}>
            {STRINGS.trips.resultHeading(trimmedDestination, matches.length, personWord(matches.length))}
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

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  title: { fontFamily: FONT_SERIF_BOLD, fontSize: 24, color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -4 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  hintText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  retryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },

  promptContent: { padding: 24, paddingTop: 12, gap: 12 },
  promptHero: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 12 },

  countriesSection: { marginTop: 8, gap: 18 },
  countriesGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  continentGroup: { gap: 8 },
  continentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  continentLabel: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  countryChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countryChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  countryChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

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
  rowName: { fontFamily: FONT_SERIF_BOLD, fontSize: 16, color: colors.textPrimary },
  rowLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
