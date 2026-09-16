import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ContactType, PersonDraft } from '../types/person';
import type { RootStackParamList } from '../navigation/types';
import { insertPerson, updatePerson, getPerson, type EditablePersonFields } from '../lib/people';
import { uploadPersonPhotos } from '../lib/storage';
import { geocodeLocation } from '../lib/geocoding';
import { isNetworkError } from '../lib/network';
import { colors } from '../theme/colors';
import { STRINGS } from '../constants/strings';

/** Loči že naložene (remote) fotografije od na novo izbranih lokalnih (file://…). */
function isRemoteUrl(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

type ContactOption = {
  type: ContactType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  autoCapitalize: 'none' | 'sentences';
};

const CONTACT_OPTIONS: ContactOption[] = [
  { type: 'phone', label: STRINGS.contactLabels.phone, icon: 'call-outline', placeholder: '+386 40 123 456', keyboardType: 'phone-pad', autoCapitalize: 'none' },
  { type: 'whatsapp', label: STRINGS.contactLabels.whatsapp, icon: 'logo-whatsapp', placeholder: '+386 40 123 456', keyboardType: 'phone-pad', autoCapitalize: 'none' },
  { type: 'instagram', label: STRINGS.contactLabels.instagram, icon: 'logo-instagram', placeholder: '@uporabnisko_ime', keyboardType: 'default', autoCapitalize: 'none' },
  { type: 'telegram', label: STRINGS.contactLabels.telegram, icon: 'paper-plane-outline', placeholder: '@uporabnisko_ime', keyboardType: 'default', autoCapitalize: 'none' },
  { type: 'email', label: STRINGS.contactLabels.email, icon: 'mail-outline', placeholder: 'ime@primer.com', keyboardType: 'email-address', autoCapitalize: 'none' },
];

/**
 * Berljivo sporočilo iz napake. Supabase (PostgrestError) je navaden objekt
 * z `message` (+ neobvezno `details` / `hint`), ne instanca Error – zato
 * `String(e)` da "[object Object]".
 */
function describeError(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object') {
    const err = e as { message?: unknown; details?: unknown; hint?: unknown };
    if (typeof err.message === 'string' && err.message) {
      const extra = [err.details, err.hint].filter((x): x is string => typeof x === 'string' && x.length > 0);
      return extra.length > 0 ? `${err.message} (${extra.join(' – ')})` : err.message;
    }
  }
  try {
    return JSON.stringify(e);
  } catch {
    return STRINGS.common.unknownError;
  }
}

export default function AddPersonScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddPerson'>>();
  const personId = route.params?.personId;
  const isEditing = !!personId;

  // Rahel fade/slide ob uspešnem shranjevanju, namesto takojšnjega preklopa nazaj.
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 24, duration: 220, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  /** URI-ji slik – lahko mešano: obstoječi remote URL-ji (urejanje) + novi lokalni file://. Prva slika = profilna. */
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [contactType, setContactType] = useState<ContactType>('whatsapp');
  const [contactValue, setContactValue] = useState('');
  const [note, setNote] = useState('');
  const [metLocation, setMetLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savePhase, setSavePhase] = useState<'idle' | 'geocoding' | 'uploading' | 'saving'>('idle');
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pri urejanju naloži obstoječe podatke osebe in vnaprej izpolni obrazec.
  useEffect(() => {
    if (!personId) return;
    let cancelled = false;
    (async () => {
      setLoadingExisting(true);
      setLoadError(null);
      try {
        const row = await getPerson(personId);
        if (cancelled) return;
        if (!row) {
          setLoadError(STRINGS.addPerson.loadErrorNotFound);
          return;
        }
        setFirstName(row.first_name);
        setLastName(row.last_name);
        setCountry(row.country);
        setCity(row.city);
        setContactType(row.contact_type);
        setContactValue(row.contact_value ?? '');
        setNote(row.note ?? '');
        setMetLocation(row.met_location ?? '');
        setTags(row.tags ?? []);
        setPhotoUris(row.photo_urls && row.photo_urls.length > 0 ? row.photo_urls : row.photo_url ? [row.photo_url] : []);
      } catch (e) {
        if (!cancelled) {
          console.error('[AddPerson] nalaganje osebe za urejanje ni uspelo:', e);
          setLoadError(e instanceof Error ? e.message : STRINGS.addPerson.loadErrorGeneric);
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const activeContact = useMemo(
    () => CONTACT_OPTIONS.find((o) => o.type === contactType) ?? CONTACT_OPTIONS[0],
    [contactType],
  );

  /**
   * Dodaj eno (kamera) ali več (galerija) fotografij v `photoUris`.
   * Če je bil seznam prazen, prva izbrana slika postane profilna (index 0).
   */
  const pickFrom = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(STRINGS.addPerson.cameraPermissionTitle, STRINGS.addPerson.cameraPermissionMessage);
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!res.canceled) {
          setPhotoUris((prev) => [...prev, res.assets[0].uri]);
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(STRINGS.addPerson.cameraPermissionTitle, STRINGS.addPerson.galleryPermissionMessage);
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.7,
        });
        if (!res.canceled) {
          setPhotoUris((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
        }
      }
    } catch (e) {
      console.warn('[AddPerson] napaka pri izbiri fotografije', e);
      Alert.alert(STRINGS.common.error, STRINGS.addPerson.photoLoadErrorMessage);
    }
  };

  const onPhotoPress = () => {
    Alert.alert(STRINGS.addPerson.photoActionSheetTitle, STRINGS.addPerson.photoActionSheetMessage, [
      { text: STRINGS.addPerson.cameraOption, onPress: () => pickFrom('camera') },
      { text: STRINGS.addPerson.galleryOption, onPress: () => pickFrom('library') },
      ...(photoUris.length > 0
        ? [{ text: STRINGS.addPerson.removeAllPhotosOption, style: 'destructive' as const, onPress: () => setPhotoUris([]) }]
        : []),
      { text: STRINGS.common.cancel, style: 'cancel' as const },
    ]);
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  };

  /** Doda tag (brez podvajanja) in počisti vnosno polje. */
  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

  /** Uporabnik lahko tage loči tudi z vejico med tipkanjem, ne le z Enter. */
  const onTagInputChange = (text: string) => {
    if (text.includes(',')) {
      const parts = text.split(',');
      parts.slice(0, -1).forEach(addTag);
      setTagInput(parts[parts.length - 1]);
    } else {
      setTagInput(text);
    }
  };

  const onTagSubmit = () => {
    addTag(tagInput);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhotoUris([]);
    setCountry('');
    setCity('');
    setContactType('whatsapp');
    setContactValue('');
    setNote('');
    setMetLocation('');
    setTags([]);
    setTagInput('');
  };

  const onSave = async () => {
    if (saving) return;

    const missing: string[] = [];
    if (!firstName.trim()) missing.push(STRINGS.addPerson.missingFieldNames.firstName);
    if (!lastName.trim()) missing.push(STRINGS.addPerson.missingFieldNames.lastName);
    if (!country.trim()) missing.push(STRINGS.addPerson.missingFieldNames.country);
    if (!city.trim()) missing.push(STRINGS.addPerson.missingFieldNames.city);
    if (missing.length > 0) {
      Alert.alert(STRINGS.addPerson.missingFieldsTitle, `${STRINGS.addPerson.missingFieldsPrefix}${missing.join(', ')}.`);
      return;
    }

    setSaving(true);
    try {
      setSavePhase('geocoding');
      const location = await geocodeLocation(city.trim(), country.trim());
      if (!location) {
        Alert.alert(
          STRINGS.addPerson.locationNotFoundTitle,
          STRINGS.addPerson.locationNotFoundMessage(city.trim(), country.trim()),
        );
        return;
      }

      // Kraj srečanja je neobvezen; ce ga geokodiranje ne najde, samo pustimo
      // met koordinate prazne (ne blokiramo celotnega shranjevanja zaradi tega).
      let metCoords: { latitude: number; longitude: number } | null = null;
      if (metLocation.trim()) {
        try {
          metCoords = await geocodeLocation(metLocation.trim(), '');
        } catch (e) {
          console.warn('[AddPerson] geokodiranje kraja srečanja ni uspelo:', e);
        }
      }

      // Obstoječe (že naložene) slike pustimo pri miru; naložimo samo nove lokalne,
      // na njihova prvotna mesta v seznamu (vrstni red, torej profilna slika, ostane enak).
      const finalUrls: string[] = new Array(photoUris.length);
      const localIndices: number[] = [];
      const localUris: string[] = [];
      photoUris.forEach((uri, idx) => {
        if (isRemoteUrl(uri)) finalUrls[idx] = uri;
        else {
          localIndices.push(idx);
          localUris.push(uri);
        }
      });

      if (localUris.length > 0) {
        setSavePhase('uploading');
        const uploaded = await uploadPersonPhotos(localUris);
        uploaded.forEach((url, i) => {
          finalUrls[localIndices[i]] = url;
        });
      }
      setSavePhase('saving');

      const photoUrl = finalUrls[0] ?? null;
      const photoUrlsField = finalUrls.length > 0 ? finalUrls : null;
      const trimmedContactValue = contactValue.trim() || null;
      const trimmedNote = note.trim() || null;
      // Ce je uporabnik nekaj natipkal, a ni pritisnil Enter/vejice, to se vseeno stejemo kot tag.
      const finalTags = tagInput.trim() ? [...tags, tagInput.trim()] : tags;
      const tagsField = finalTags.length > 0 ? finalTags : null;

      if (isEditing && personId) {
        const fields: EditablePersonFields = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          photo_url: photoUrl,
          photo_urls: photoUrlsField,
          country: country.trim(),
          city: city.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
          contact_type: contactType,
          contact_value: trimmedContactValue,
          note: trimmedNote,
          met_location: metLocation.trim() || null,
          met_latitude: metCoords?.latitude ?? null,
          met_longitude: metCoords?.longitude ?? null,
          tags: tagsField,
        };
        const row = await updatePerson(personId, fields);
        console.log('[AddPerson] posodobljeno v Supabase:\n' + JSON.stringify(row, null, 2));
        Toast.show({ type: 'success', text1: STRINGS.addPerson.savedToastEdit, visibilityTime: 2000 });
      } else {
        const draft: PersonDraft = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          photoUrl,
          photoUrls: photoUrlsField,
          country: country.trim(),
          city: city.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
          contactType,
          contactValue: trimmedContactValue,
          note: trimmedNote,
          metDate: null,
          metLocation: metLocation.trim() || null,
          metLatitude: metCoords?.latitude ?? null,
          metLongitude: metCoords?.longitude ?? null,
          tags: tagsField,
        };
        const row = await insertPerson(draft);
        console.log('[AddPerson] shranjeno v Supabase:\n' + JSON.stringify(row, null, 2));
        Toast.show({ type: 'success', text1: STRINGS.addPerson.savedToastAdd, visibilityTime: 2000 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      resetForm();
      // Nazaj na zaslon, od koder je bil obrazec odprt (Zemljevid/Seznam/Profil) – z rahlim
      // fade/slide prehodom namesto takojšnjega preklopa; ta zaslon ob fokusu
      // (useFocusEffect) takoj naloži sveže podatke.
      closeWithAnimation();
    } catch (e) {
      console.error('[AddPerson] napaka pri shranjevanju v Supabase:', e);
      // Brez interneta (offline pisanje ni podprto) prikaži jasno, namensko sporočilo
      // namesto surove napake omrežja.
      Alert.alert(
        STRINGS.addPerson.saveErrorTitle,
        isNetworkError(e) ? STRINGS.addPerson.offlineSaveMessage : describeError(e),
      );
    } finally {
      setSaving(false);
      setSavePhase('idle');
    }
  };

  if (loadingExisting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={styles.loadErrorText}>{loadError}</Text>
        <Pressable style={styles.outlineBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.outlineBtnText}>{STRINGS.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.privacyBanner}>
          <Ionicons name="lock-closed-outline" size={15} color={colors.accentDark} />
          <Text style={styles.privacyText}>{STRINGS.addPerson.privacyNotice}</Text>
        </View>

        {/* Fotografija + ime/priimek */}
        <View style={styles.photoRow}>
          <Pressable style={styles.photo} onPress={onPhotoPress}>
            {photoUris[0] ? (
              <Image source={{ uri: photoUris[0] }} style={styles.photoImg} />
            ) : (
              <Ionicons name="camera-outline" size={26} color={colors.textMuted} />
            )}
            <View style={styles.photoBadge}>
              <Ionicons name={photoUris[0] ? 'pencil' : 'add'} size={12} color={colors.onPrimary} />
            </View>
          </Pressable>

          <View style={styles.photoRowFields}>
            <View>
              <Text style={styles.label}>{STRINGS.addPerson.firstNameLabel}</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={STRINGS.addPerson.firstNamePlaceholder}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View>
              <Text style={styles.label}>{STRINGS.addPerson.lastNameLabel}</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={STRINGS.addPerson.lastNamePlaceholder}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Lokacija */}
        <Text style={styles.sectionTitle}>{STRINGS.addPerson.locationSectionTitle}</Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.label}>{STRINGS.addPerson.countryLabel}</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder={STRINGS.addPerson.countryPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>{STRINGS.addPerson.cityLabel}</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder={STRINGS.addPerson.cityPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <Text style={styles.hint}>{STRINGS.addPerson.locationHint}</Text>

        {/* Kraj srečanja (neobvezno) */}
        <Text style={styles.sectionTitle}>{STRINGS.addPerson.metLocationSectionTitle}</Text>
        <TextInput
          style={styles.input}
          value={metLocation}
          onChangeText={setMetLocation}
          placeholder={STRINGS.addPerson.metLocationPlaceholder}
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.hint}>{STRINGS.addPerson.metLocationHint}</Text>

        {/* Kontakt */}
        <Text style={styles.sectionTitle}>{STRINGS.addPerson.contactSectionTitle}</Text>
        <View style={styles.contactRow}>
          {CONTACT_OPTIONS.map((opt) => {
            const active = opt.type === contactType;
            return (
              <Pressable
                key={opt.type}
                onPress={() => setContactType(opt.type)}
                style={[styles.contactChip, active && styles.contactChipActive]}
              >
                <Ionicons
                  name={opt.icon}
                  size={15}
                  color={active ? colors.onPrimary : colors.textSecondary}
                />
                <Text style={[styles.contactChipText, active && styles.contactChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          value={contactValue}
          onChangeText={setContactValue}
          placeholder={activeContact.placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={activeContact.keyboardType}
          autoCapitalize={activeContact.autoCapitalize}
          autoCorrect={false}
        />

        {/* Dodatne (spominske) fotografije */}
        <Text style={styles.sectionTitle}>{STRINGS.addPerson.photosSectionTitle}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
          {photoUris.slice(1).map((uri) => (
            <View key={uri} style={styles.galleryThumbWrap}>
              <Image source={{ uri }} style={styles.galleryThumb} />
              <Pressable style={styles.galleryRemoveBadge} onPress={() => removePhoto(uri)}>
                <Ionicons name="close" size={12} color={colors.onPrimary} />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addTile} onPress={onPhotoPress}>
            <Ionicons name="add" size={22} color={colors.textMuted} />
          </Pressable>
        </ScrollView>
        <Text style={styles.hint}>{STRINGS.addPerson.photosHint}</Text>

        {/* Tagi */}
        <Text style={styles.sectionTitle}>{STRINGS.addPerson.tagsSectionTitle}</Text>
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
                <Pressable onPress={() => removeTag(tag)} hitSlop={6}>
                  <Ionicons name="close" size={13} color={colors.onPrimary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <TextInput
          style={styles.input}
          value={tagInput}
          onChangeText={onTagInputChange}
          onSubmitEditing={onTagSubmit}
          placeholder={STRINGS.addPerson.tagsPlaceholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          blurOnSubmit={false}
        />

        {/* Beležka */}
        <Text style={styles.sectionTitle}>{STRINGS.addPerson.noteSectionTitle}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={note}
          onChangeText={setNote}
          placeholder={STRINGS.addPerson.notePlaceholder}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            saving && styles.saveBtnDisabled,
          ]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Ionicons name="earth" size={18} color={colors.onPrimary} />
          )}
          <Text style={styles.saveBtnText}>
            {savePhase === 'geocoding'
              ? STRINGS.addPerson.savingLocation
              : savePhase === 'uploading'
                ? STRINGS.addPerson.savingPhotos
                : saving
                  ? STRINGS.addPerson.saving
                  : isEditing
                    ? STRINGS.addPerson.saveButtonEdit
                    : STRINGS.addPerson.saveButtonAdd}
          </Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48, gap: 8 },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadErrorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  privacyText: { flex: 1, fontSize: 12, color: colors.textSecondary },

  photoRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  photoRowFields: { flex: 1, gap: 10 },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: { width: 84, height: 84, borderRadius: 42 },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 6, lineHeight: 16 },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 96, paddingTop: 12 },

  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  contactChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  contactChipTextActive: { color: colors.onPrimary },

  galleryRow: { gap: 10, paddingVertical: 2 },
  galleryThumbWrap: { width: 64, height: 64 },
  galleryThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  galleryRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  addTile: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  tagChipText: { fontSize: 12, fontWeight: '600', color: colors.onPrimary },

  saveBtn: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveBtnPressed: { backgroundColor: colors.primaryDark },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
});
