import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Share,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import type { RootStackParamList } from '../navigation/types';
import type { ContactType } from '../types/person';
import { getPerson, deletePerson, type PeopleRow, type PersonContactRow } from '../lib/people';
import { getConnectionLocation, type ConnectionLocation } from '../lib/connections';
import { updatedAgoLabel } from '../lib/dates';
import { withAlpha, type AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';
import LoadingState from '../components/LoadingState';
import MetStampBadge from '../components/MetStampBadge';
import ShareCard from '../components/ShareCard';

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

export default function PersonProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PersonProfile'>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const personId = route.params?.personId;

  const [person, setPerson] = useState<PeopleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const shareCardRef = useRef<View>(null);
  const [connectionLocation, setConnectionLocation] = useState<ConnectionLocation | null>(null);

  // Trenutna lokacija povezanega računa: strežnik jo vrne samo pri sprejeti povezavi in če uporabnik deli.
  // Ob napaki ali brez podatka sekcije preprosto ne pokažemo.
  const linkedUserId = person?.linked_user_id ?? null;
  useEffect(() => {
    setConnectionLocation(null);
    if (!linkedUserId) return;
    let cancelled = false;
    getConnectionLocation(linkedUserId)
      .then((loc) => {
        if (!cancelled) setConnectionLocation(loc);
      })
      .catch((e) => console.warn('[PersonProfile] lokacija povezave ni na voljo:', e));
    return () => {
      cancelled = true;
    };
  }, [linkedUserId]);

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

  const onWrite = async (contact: PersonContactRow) => {
    const url = buildContactUrl(contact.contact_type, contact.contact_value);
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

  /** Zajame ShareCard (izven vidnega polja) kot sliko in jo deli prek sistemskega Share API-ja. */
  const onShare = async () => {
    if (!person || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      const message = STRINGS.personProfile.shareMessage(person.first_name, person.city);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: message, mimeType: 'image/png', UTI: 'public.png' });
      } else {
        // Rezerva, ce sistemski share sheet ni na voljo (redko) - deli vsaj besedilo.
        await Share.share({ message });
      }
    } catch (e) {
      console.error('[PersonProfile] deljenje ni uspelo:', e);
      Alert.alert(STRINGS.common.error, STRINGS.personProfile.shareErrorMessage);
    } finally {
      setSharing(false);
    }
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
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
          {hasMeeting ? (
            <MetStampBadge
              label="MET"
              primary={person.met_location}
              secondary={person.met_date ? person.met_date.slice(0, 4) : null}
            />
          ) : null}
        </View>
      </View>

      {connectionLocation ? (
        <View style={styles.connectionLocation}>
          <Ionicons name="navigate-circle-outline" size={18} color={colors.secondary} />
          <View style={styles.connectionLocationText}>
            <Text style={styles.connectionLocationValue}>
              {STRINGS.personProfile.currentlyIn(connectionLocation.current_location)}
            </Text>
            <Text style={styles.connectionLocationAgo}>{updatedAgoLabel(connectionLocation.current_location_updated_at)}</Text>
          </View>
        </View>
      ) : null}

      {/* Kontakti */}
      {person.person_contacts.length > 0 ? (
        <View style={styles.contactsList}>
          {person.person_contacts.map((contact) => (
            <Pressable
              key={contact.id}
              style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
              onPress={() => onWrite(contact)}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.personProfile.messageAccessibilityLabel(CONTACT_LABEL[contact.contact_type])}
            >
              <View style={styles.contactIconWrap}>
                <Ionicons name={CONTACT_ICON[contact.contact_type]} size={18} color={colors.onPrimary} />
              </View>
              <View style={styles.contactRowText}>
                <Text style={styles.contactRowLabel}>{CONTACT_LABEL[contact.contact_type]}</Text>
                <Text style={styles.contactRowValue}>{contact.contact_value}</Text>
              </View>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.noContactRow}>
          <Text style={styles.noContactText}>{STRINGS.personProfile.writeButtonNoContact}</Text>
        </View>
      )}

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
              <Pressable
                onPress={() => setViewerIndex(index)}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.personProfile.viewPhotoAccessibilityLabel(index + 1)}
              >
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
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}
          onPress={onShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
          )}
          <Text style={styles.outlineBtnText}>{STRINGS.personProfile.shareButton}</Text>
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

      {/* Izven vidnega polja – uporabi se samo za zajem slike ob deljenju (glej onShare). */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard
          ref={shareCardRef}
          name={fullName}
          location={`${person.city}, ${person.country}`}
          photoUrl={photos[0] ?? null}
        />
      </View>

      <ImageViewing
        images={photos.map((uri) => ({ uri }))}
        imageIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onRequestClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
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
  offscreen: { position: 'absolute', top: -9999, left: -9999 },

  header: { alignItems: 'center', marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  headerIdentity: { alignItems: 'center' },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surfaceMuted },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { marginTop: 12, fontFamily: FONT_SERIF_BOLD, fontSize: 24, color: colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  location: { fontSize: 14, color: colors.textSecondary },

  gallerySection: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.border },
  galleryList: { marginTop: 8, marginHorizontal: -20 },
  galleryRow: { gap: 10, paddingHorizontal: 20 },
  galleryThumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.surfaceMuted },

  connectionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  connectionLocationText: { flex: 1 },
  connectionLocationValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  connectionLocationAgo: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  contactsList: { gap: 10 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  contactRowPressed: { opacity: 0.7 },
  contactIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRowText: { flex: 1 },
  contactRowLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  contactRowValue: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  noContactRow: { alignItems: 'center', paddingVertical: 8 },
  noContactText: { fontSize: 13, color: colors.textMuted },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  tag: {
    backgroundColor: withAlpha(colors.accent, 0.18),
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.4),
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  tagText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },

  section: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.border,
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
