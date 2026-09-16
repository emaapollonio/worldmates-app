import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import { supabase } from '../lib/supabase';
import { listPeople, computeStats, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';
import { STRINGS } from '../constants/strings';

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Naloži ob vsakem fokusu, da statistika po dodajanju/urejanju/brisanju ostane sveža.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoadingStats(true);
        try {
          const rows = await listPeople();
          if (!cancelled) setPeople(rows);
        } catch (e) {
          console.error('[Profile] nalaganje statistike ni uspelo:', e);
        } finally {
          if (!cancelled) setLoadingStats(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const stats = useMemo(() => computeStats(people), [people]);

  const onLogout = () => {
    Alert.alert(STRINGS.profile.logoutConfirmTitle, STRINGS.profile.logoutConfirmMessage, [
      { text: STRINGS.common.cancel, style: 'cancel' },
      {
        text: STRINGS.profile.logoutButton,
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('[Profile] odjava ni uspela:', error);
            Alert.alert(STRINGS.profile.logoutErrorTitle, error.message);
          }
          // Ob uspehu RootNavigator prek onAuthStateChange sam preklopi na AuthScreen.
        },
      },
    ]);
  };

  return (
    <ScreenPlaceholder title={STRINGS.profile.title} subtitle={STRINGS.profile.subtitle} icon="person-outline">
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>{STRINGS.profile.statsTitle}</Text>
        {loadingStats ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard value={stats.totalPeople} label={STRINGS.profile.statFriends} />
            <StatCard value={stats.countryCount} label={STRINGS.profile.statCountries} />
            <StatCard value={stats.continentCount} label={STRINGS.profile.statContinents} />
          </View>
        )}
      </View>

      <PlaceholderButton label={STRINGS.profile.logoutButton} variant="outline" onPress={onLogout} />
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  statsSection: { alignSelf: 'stretch', marginBottom: 4 },
  statsTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
