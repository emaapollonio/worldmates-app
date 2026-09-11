import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';

import type { RootStackParamList } from '../navigation/types';
import type { ContactType } from '../types/person';
import { getPerson, deletePerson, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';

const CONTACT_LABEL: Record<ContactType, string> = {
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  telegram: 'Telegram',
  email: 'E-pošta',
};

const CONTACT_ICON: Record<ContactType, keyof typeof Ionicons.glyphMap> = {
  phone: 'call-outline',
  whatsapp: 'logo-whatsapp',
  instagram: 'logo-instagram',
  telegram: 'paper-plane-outline',
  email: 'mail-outline',
};

/** Sestavi URL za deep link glede na tip kontakta. */
function buildContactUrl(type: ContactType, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (type) {
    case 'whatsapp':
      return `https://wa.me/${v.replace(/[^\d]/g, '')}`;
    case 'phone':
      return `tel:${v.replace(/[^\d+]/g, '')}`;
    case 'email':
      return `mailto:${v}`;
    case 'instagram':
      return `https://instagram.com/${v.replace(/^@/, '')}`;
    case 'telegram':
      return `https://t.me/${v.replace(/^@/, '')}`;
    default:
      return null;
  }
}

/** "YYYY-MM-DD" -> "d. m. YYYY" */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

export default function PersonProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PersonProfile'>>();
  const personId = route.params?.personId;

  const [person, setPerson] = useState<PeopleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!personId) {
      setError('Manjka personId v navigacijskih parametrih.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await getPerson(personId);
        if (cancelled) return;
        if (!row) setError('Osebe ni bilo mogoče najti.');
        else setPerson(row);
      } catch (e) {
        if (!cancelled) {
          console.error('[PersonProfile] nalaganje ni uspelo:', e);
          setError(e instanceof Error ? e.message : 'Nalaganje ni uspelo.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const onWrite = async () => {
    if (!person?.contact_value) {
      Alert.alert('Ni kontakta', 'Za to osebo ni shranjenega kontakta.');
      return;
    }
    const url = buildContactUrl(person.contact_type, person.contact_value);
    if (!url) {
      Alert.alert('Ni kontakta', 'Kontakta ni bilo mogoče pretvoriti v povezavo.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('[PersonProfile] Linking.openURL ni uspel:', e);
      Alert.alert('Napaka', 'Povezave ni bilo mogoče odpreti.');
    }
  };

  const onEdit = () => {
    // Pravo urejanje (prednapolnjen obrazec) dodamo kasneje.
    navigation.navigate('AddPerson');
  };

  const onDelete = () => {
    if (!person) return;
    Alert.alert(
      'Izbriši osebo',
      `Res želiš izbrisati ${person.first_name} ${person.last_name}? Tega ni mogoče razveljaviti.`,
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePerson(person.id);
              navigation.goBack();
            } catch (e) {
              setDeleting(false);
              console.error('[PersonProfile] brisanje ni uspelo:', e);
              Alert.alert('Napaka pri brisanju', e instanceof Error ? e.message : 'Poskusi znova.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !person) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorText}>{error ?? 'Osebe ni bilo mogoče naložiti.'}</Text>
        <Pressable style={styles.outlineBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.outlineBtnText}>Nazaj</Text>
        </Pressable>
      </View>
    );
  }

  const fullName = `${person.first_name} ${person.last_name}`;
  const hasContact = !!person.contact_value;
  const hasMeeting = !!person.met_date || !!person.met_location;
  // photo_urls (novo, polje slik) ima prednost; photo_url (staro, ena slika) kot fallback.
  const photos =
    person.photo_urls && person.photo_urls.length > 0
      ? person.photo_urls
      : person.photo_url
        ? [person.photo_url]
        : [];

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Glava */}
      <View style={styles.header}>
        {photos[0] ? (
          <Image source={{ uri: photos[0] }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={44} color={colors.textMuted} />
          </View>
        )}
        <Text style={styles.name}>{fullName}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.location}>
            {person.city}, {person.country}
          </Text>
        </View>
      </View>

      {/* Galerija skupnih slik */}
      {photos.length > 0 ? (
        <FlatList
          data={photos}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, idx) => `${idx}-${uri}`}
          contentContainerStyle={styles.galleryRow}
          style={styles.galleryList}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => setViewerIndex(index)}>
              <Image source={{ uri: item }} style={styles.galleryThumb} />
            </Pressable>
          )}
        />
      ) : null}

      {/* Piši */}
      <Pressable
        style={({ pressed }) => [
          styles.writeBtn,
          pressed && styles.writeBtnPressed,
          !hasContact && styles.writeBtnDisabled,
        ]}
        onPress={onWrite}
        disabled={!hasContact}
      >
        <Ionicons name={CONTACT_ICON[person.contact_type]} size={18} color={colors.onPrimary} />
        <Text style={styles.writeBtnText}>
          {hasContact ? `Piši prek ${CONTACT_LABEL[person.contact_type]}` : 'Ni shranjenega kontakta'}
        </Text>
      </Pressable>
      {hasContact ? <Text style={styles.contactValue}>{person.contact_value}</Text> : null}

      {/* Tagi */}
      {person.tags && person.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {person.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Kako sva se spoznala */}
      {hasMeeting ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kako sva se spoznala</Text>
          {person.met_location ? (
            <View style={styles.metaRow}>
              <Ionicons name="map-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.sectionText}>{person.met_location}</Text>
            </View>
          ) : null}
          {person.met_date ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.sectionText}>{formatDate(person.met_date)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Beležka */}
      {person.note ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opombe</Text>
          <Text style={styles.sectionText}>{person.note}</Text>
        </View>
      ) : null}

      {/* Urejanje / brisanje */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.outlineBtnText}>Uredi</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          )}
          <Text style={styles.deleteBtnText}>Izbriši</Text>
        </Pressable>
      </View>
      </ScrollView>

      <ImageViewing
        images={photos.map((uri) => ({ uri }))}
        imageIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onRequestClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  header: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surfaceMuted },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { marginTop: 12, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  location: { fontSize: 14, color: colors.textSecondary },

  galleryList: { marginTop: 16, marginHorizontal: -20 },
  galleryRow: { gap: 10, paddingHorizontal: 20 },
  galleryThumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.surfaceMuted },

  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  writeBtnPressed: { backgroundColor: colors.primaryDark },
  writeBtnDisabled: { backgroundColor: colors.textMuted },
  writeBtnText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  contactValue: { textAlign: 'center', marginTop: 8, fontSize: 13, color: colors.textSecondary },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  section: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sectionText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 13,
  },
  outlineBtnPressed: { opacity: 0.7 },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 13,
  },
  deleteBtnPressed: { opacity: 0.7 },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: colors.danger },
});
