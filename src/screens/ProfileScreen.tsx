import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import { supabase } from '../lib/supabase';
import { listPeople, computeStats, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';

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
    Alert.alert('Odjava', 'Se res želiš odjaviti?', [
      { text: 'Prekliči', style: 'cancel' },
      {
        text: 'Odjava',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('[Profile] odjava ni uspela:', error);
            Alert.alert('Napaka pri odjavi', error.message);
          }
          // Ob uspehu RootNavigator prek onAuthStateChange sam preklopi na AuthScreen.
        },
      },
    ]);
  };

  return (
    <ScreenPlaceholder
      title="Profil"
      subtitle="Uporabnikov račun, statistika (št. držav / celin) in nastavitve."
      icon="person-outline"
    >
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Statistika</Text>
        {loadingStats ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard value={stats.totalPeople} label="prijateljev" />
            <StatCard value={stats.countryCount} label="držav" />
            <StatCard value={stats.continentCount} label="celin" />
          </View>
        )}
      </View>

      <PlaceholderButton label="Odjava" variant="outline" onPress={onLogout} />
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
