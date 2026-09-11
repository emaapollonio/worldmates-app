import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { listPeople, matchesQuery, matchesTags, collectUniqueTags, type PeopleRow } from '../lib/people';
import { colors, colorForLetter } from '../theme/colors';
import SearchBar from '../components/SearchBar';
import TagFilterRow from '../components/TagFilterRow';

/** Ob prvem odprtju je zemljevid oddaljen na cel svet – uporabnik nato sam zoom-a. */
const INITIAL_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 90,
  longitudeDelta: 180,
};

/**
 * Pod tem latitudeDelta (bolj približan pogled) se prikažejo podrobni pini
 * (fotografija/začetnica); nad tem (oddaljen, svetovni pogled) enostavni
 * privzeti rdeči pini, ker so podrobnosti pri takem pogledu vizualno prehitre.
 */
const DETAILED_ZOOM_THRESHOLD = 20;

/** Okrogel pin: fotografija osebe (prva iz photo_urls / stari photo_url) ali začetnica imena. */
function PersonMarker({ person, onPress }: { person: PeopleRow; onPress: () => void }) {
  const photoUrl = person.photo_urls?.[0] ?? person.photo_url ?? null;
  const [tracksViewChanges, setTracksViewChanges] = useState(!!photoUrl);

  return (
    <Marker
      coordinate={{ latitude: person.latitude, longitude: person.longitude }}
      title={`${person.first_name} ${person.last_name}`}
      description={`${person.city}, ${person.country}`}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.markerRing}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.markerPhoto}
            onLoad={() => setTracksViewChanges(false)}
            onError={() => setTracksViewChanges(false)}
          />
        ) : (
          <View style={[styles.markerLetterWrap, { backgroundColor: colorForLetter(person.first_name[0] ?? '?') }]}>
            <Text style={styles.markerLetterText}>{(person.first_name[0] ?? '?').toUpperCase()}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mapRef = useRef<MapView>(null);

  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [latitudeDelta, setLatitudeDelta] = useState(INITIAL_REGION.latitudeDelta);

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

  const uniqueTags = useMemo(() => collectUniqueTags(people), [people]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  // Pini, ki ustrezajo iskanju IN izbranim tagom (prazno iskanje/izbira = vsi).
  const visiblePeople = useMemo(
    () => people.filter((p) => matchesQuery(p, query) && matchesTags(p, selectedTags)),
    [people, query, selectedTags],
  );
  const hasActiveFilter = query.trim().length > 0 || selectedTags.length > 0;

  // Ob prvem odprtju ostane zemljevid oddaljen na cel svet (INITIAL_REGION).
  // Samo med aktivnim iskanjem/filtrom se pogled prilagodi na rezultate.
  useEffect(() => {
    if (!mapReady || !hasActiveFilter || visiblePeople.length === 0) return;
    mapRef.current?.fitToCoordinates(
      visiblePeople.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      { edgePadding: { top: 90, right: 90, bottom: 90, left: 90 }, animated: true },
    );
  }, [mapReady, hasActiveFilter, visiblePeople]);

  const onMapReady = () => {
    setMapReady(true);
    // `initialRegion` je namenjen samo prvemu izrisu, a se pri react-native-maps
    // (zlasti po Fast Refresh / na nekaterih napravah) ne uveljavi zanesljivo –
    // zato ob pripravljenem zemljevidu svetovni pogled vsilimo tudi eksplicitno.
    mapRef.current?.animateToRegion(INITIAL_REGION, 0);
  };

  const goToProfile = (personId: string) => navigation.navigate('PersonProfile', { personId });

  const isDetailedZoom = latitudeDelta < DETAILED_ZOOM_THRESHOLD;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        onMapReady={onMapReady}
        onRegionChangeComplete={(region) => setLatitudeDelta(region.latitudeDelta)}
      >
        {visiblePeople.map((p) =>
          isDetailedZoom ? (
            <PersonMarker key={p.id} person={p} onPress={() => goToProfile(p.id)} />
          ) : (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={`${p.first_name} ${p.last_name}`}
              description={`${p.city}, ${p.country}`}
              onPress={() => goToProfile(p.id)}
            />
          ),
        )}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.topOverlay}>
        <SearchBar value={query} onChangeText={setQuery} />

        {uniqueTags.length > 0 ? (
          <TagFilterRow tags={uniqueTags} selected={selectedTags} onToggle={toggleTag} />
        ) : null}

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

        {/* Status: iskanje/filter brez zadetkov */}
        {!loading && !error && people.length > 0 && hasActiveFilter && visiblePeople.length === 0 ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Ni zadetkov za izbrano iskanje/filter.</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
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

  markerRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  markerPhoto: { width: '100%', height: '100%', borderRadius: 16 },
  markerLetterWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  markerLetterText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
});
