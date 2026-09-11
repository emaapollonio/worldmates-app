import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { listPeople, matchesQuery, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';
import SearchBar from '../components/SearchBar';

/** Privzeti pogled (širša Evropa), dokler nimamo oseb za uokvirjanje. */
const INITIAL_REGION: Region = {
  latitude: 47,
  longitude: 12,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');

  const loadPeople = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPeople();
      if (!signal?.cancelled) setPeople(rows);
    } catch (e) {
      if (!signal?.cancelled) {
        console.error('[MapScreen] nalaganje oseb ni uspelo:', e);
        setError(e instanceof Error ? e.message : 'Oseb ni bilo mogoče naložiti.');
      }
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, []);

  // Naloži osebe vsakič, ko zaslon postane aktiven (tudi po dodajanju nove osebe).
  useFocusEffect(
    useCallback(() => {
      const signal = { cancelled: false };
      loadPeople(signal);
      return () => {
        signal.cancelled = true;
      };
    }, [loadPeople]),
  );

  // Pini, ki ustrezajo iskanju (prazno iskanje = vsi).
  const visiblePeople = useMemo(() => people.filter((p) => matchesQuery(p, query)), [people, query]);

  // Ko so vidni pini na voljo in je zemljevid pripravljen, uokviri nanje
  // (tudi ob iskanju – tako se pogled prilagodi na filtrirane rezultate).
  useEffect(() => {
    if (!mapReady || visiblePeople.length === 0) return;
    mapRef.current?.fitToCoordinates(
      visiblePeople.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      { edgePadding: { top: 90, right: 90, bottom: 90, left: 90 }, animated: true },
    );
  }, [mapReady, visiblePeople]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        onMapReady={() => setMapReady(true)}
      >
        {visiblePeople.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={`${p.first_name} ${p.last_name}`}
            description={`${p.city}, ${p.country}`}
            onPress={() => navigation.navigate('PersonProfile', { personId: p.id })}
          />
        ))}
      </MapView>

      <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
        <SearchBar value={query} onChangeText={setQuery} />

        {/* Status: nalaganje */}
        {loading && people.length === 0 ? (
          <View style={styles.pill}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.pillText}>Nalagam osebe …</Text>
          </View>
        ) : null}

        {/* Status: napaka */}
        {error ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Napaka pri nalaganju</Text>
            <Text style={styles.cardText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
              onPress={() => loadPeople()}
            >
              <Text style={styles.retryBtnText}>Poskusi znova</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Status: brez oseb (sploh) */}
        {!loading && !error && people.length === 0 ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Nimaš še nobene osebe — dodaj prvo z gumbom +</Text>
          </View>
        ) : null}

        {/* Status: iskanje brez zadetkov */}
        {!loading && !error && people.length > 0 && query.trim().length > 0 && visiblePeople.length === 0 ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Ni zadetkov za "{query.trim()}".</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 10,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pillText: { fontSize: 13, color: colors.textPrimary, flexShrink: 1 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardText: { fontSize: 13, color: colors.textSecondary },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryBtnPressed: { backgroundColor: colors.primaryDark },
  retryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },
});
