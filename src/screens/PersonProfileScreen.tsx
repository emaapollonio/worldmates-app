import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '../navigation/types';
import type { ContactType } from '../types/person';
import { getPerson, deletePerson, type PeopleRow } from '../lib/people';
import { colors } from '../theme/colors';
import { STRINGS } from '../constants/strings';
import LoadingState from '../components/LoadingState';

const CONTACT_LABEL: Record<ContactType, string> = STRINGS.contactLabels;

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

  // Naloži ob vsakem fokusu – tako se po urejanju (AddPerson -> goBack) takoj vidijo sveže vrednosti.
  useFocusEffect(
    useCallback(() => {
      if (!personId) {
        setError(STRINGS.personProfile.missingParamError);
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
          if (!row) setError(STRINGS.personProfile.notFound);
          else setPerson(row);
        } catch (e) {
          if (!cancelled) {
            console.error('[PersonProfile] nalaganje ni uspelo:', e);
            setError(e instanceof Error ? e.message : STRINGS.personProfile.loadErrorGeneric);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [personId]),
  );

  const onWrite = async () => {
    if (!person?.contact_value) {
      Alert.alert(STRINGS.personProfile.noContactTitle, STRINGS.personProfile.noContactSavedMessage);
      return;
    }
    const url = buildContactUrl(person.contact_type, person.contact_value);
    if (!url) {
      Alert.alert(STRINGS.personProfile.noContactTitle, STRINGS.personProfile.noContactUrlMessage);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('[PersonProfile] Linking.openURL ni uspel:', e);
      Alert.alert(STRINGS.personProfile.openLinkErrorTitle, STRINGS.personProfile.openLinkErrorMessage);
    }
  };

  const onEdit = () => {
    if (!person) return;
    navigation.navigate('AddPerson', { personId: person.id });
  };

  const onDelete = () => {
    if (!person) return;
    Alert.alert(
      STRINGS.personProfile.deleteConfirmTitle,
      STRINGS.personProfile.deleteConfirmMessage(`${person.first_name} ${person.last_name}`),
      [
        { text: STRINGS.common.cancel, style: 'cancel' },
        {
          text: STRINGS.common.delete,
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePerson(person.id);
              Toast.show({ type: 'success', text1: STRINGS.personProfile.deletedToast, visibilityTime: 2000 });
              navigation.goBack();
            } catch (e) {
              setDeleting(false);
              console.error('[PersonProfile] brisanje ni uspelo:', e);
              Alert.alert(
                STRINGS.personProfile.deleteErrorTitle,
                e instanceof Error ? e.message : STRINGS.common.genericRetryMessage,
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingState message={STRINGS.common.loading} />;
  }

  if (error || !person) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorText}>{error ?? STRINGS.personProfile.notFound}</Text>
        <Pressable style={styles.outlineBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.outlineBtnText}>{STRINGS.common.back}</Text>
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
          {hasContact
            ? `${STRINGS.personProfile.writeButtonPrefix}${CONTACT_LABEL[person.contact_type]}`
            : STRINGS.personProfile.writeButtonNoContact}
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
          <Text style={styles.sectionTitle}>{STRINGS.personProfile.meetingSectionTitle}</Text>
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
          <Text style={styles.sectionTitle}>{STRINGS.personProfile.noteSectionTitle}</Text>
          <Text style={styles.sectionText}>{person.note}</Text>
        </View>
      ) : null}

      {/* Galerija skupnih slik */}
      {photos.length > 0 ? (
        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>{STRINGS.personProfile.gallerySectionTitle}</Text>
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
        </View>
      ) : null}

      {/* Urejanje / brisanje */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.outlineBtnText}>{STRINGS.common.edit}</Text>
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
          <Text style={styles.deleteBtnText}>{STRINGS.common.delete}</Text>
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

  gallerySection: { marginTop: 18 },
  galleryList: { marginTop: 8, marginHorizontal: -20 },
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
