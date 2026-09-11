import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ContactType, PersonDraft } from '../types/person';
import type { RootStackParamList } from '../navigation/types';
import { insertPerson } from '../lib/people';
import { uploadPersonPhotos } from '../lib/storage';
import { geocodeLocation } from '../lib/geocoding';
import { colors } from '../theme/colors';

type ContactOption = {
  type: ContactType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  autoCapitalize: 'none' | 'sentences';
};

const CONTACT_OPTIONS: ContactOption[] = [
  { type: 'phone', label: 'Telefon', icon: 'call-outline', placeholder: '+386 40 123 456', keyboardType: 'phone-pad', autoCapitalize: 'none' },
  { type: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', placeholder: '+386 40 123 456', keyboardType: 'phone-pad', autoCapitalize: 'none' },
  { type: 'instagram', label: 'Instagram', icon: 'logo-instagram', placeholder: '@uporabnisko_ime', keyboardType: 'default', autoCapitalize: 'none' },
  { type: 'telegram', label: 'Telegram', icon: 'paper-plane-outline', placeholder: '@uporabnisko_ime', keyboardType: 'default', autoCapitalize: 'none' },
  { type: 'email', label: 'E-pošta', icon: 'mail-outline', placeholder: 'ime@primer.com', keyboardType: 'email-address', autoCapitalize: 'none' },
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
    return 'Neznana napaka';
  }
}

export default function AddPersonScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  /** Lokalni URI-ji (pred nalaganjem). Prva slika = profilna. */
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [contactType, setContactType] = useState<ContactType>('whatsapp');
  const [contactValue, setContactValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savePhase, setSavePhase] = useState<'idle' | 'geocoding' | 'uploading' | 'saving'>('idle');

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
          Alert.alert('Ni dovoljenja', 'Za fotografiranje omogoči dostop do kamere.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!res.canceled) {
          setPhotoUris((prev) => [...prev, res.assets[0].uri]);
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Ni dovoljenja', 'Za izbiro slike omogoči dostop do galerije.');
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
      Alert.alert('Napaka', 'Fotografije ni bilo mogoče naložiti.');
    }
  };

  const onPhotoPress = () => {
    Alert.alert('Fotografije prijatelja', 'Izberi vir (v galeriji lahko izbereš več naenkrat)', [
      { text: 'Kamera', onPress: () => pickFrom('camera') },
      { text: 'Galerija', onPress: () => pickFrom('library') },
      ...(photoUris.length > 0
        ? [{ text: 'Odstrani vse fotografije', style: 'destructive' as const, onPress: () => setPhotoUris([]) }]
        : []),
      { text: 'Prekliči', style: 'cancel' as const },
    ]);
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
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
  };

  const onSave = async () => {
    if (saving) return;

    const missing: string[] = [];
    if (!firstName.trim()) missing.push('ime');
    if (!lastName.trim()) missing.push('priimek');
    if (!country.trim()) missing.push('država');
    if (!city.trim()) missing.push('kraj');
    if (missing.length > 0) {
      Alert.alert('Manjkajoči podatki', `Izpolni še: ${missing.join(', ')}.`);
      return;
    }

    setSaving(true);
    try {
      setSavePhase('geocoding');
      const location = await geocodeLocation(city.trim(), country.trim());
      if (!location) {
        Alert.alert(
          'Lokacije ni bilo mogoče najti',
          `Za "${city.trim()}, ${country.trim()}" nismo našli koordinat. Preveri zapis kraja/države in poskusi znova.`,
        );
        return;
      }

      let uploadedUrls: string[] = [];
      if (photoUris.length > 0) {
        setSavePhase('uploading');
        uploadedUrls = await uploadPersonPhotos(photoUris);
      }
      setSavePhase('saving');

      const draft: PersonDraft = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoUrl: uploadedUrls[0] ?? null,
        photoUrls: uploadedUrls.length > 0 ? uploadedUrls : null,
        country: country.trim(),
        city: city.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        contactType,
        contactValue: contactValue.trim() || null,
        note: note.trim() || null,
        metDate: null,
        metLocation: null,
        tags: null,
      };

      const row = await insertPerson(draft);
      console.log('[AddPerson] shranjeno v Supabase:\n' + JSON.stringify(row, null, 2));
      resetForm();
      // Nazaj na zaslon, od koder je bil obrazec odprt (Zemljevid/Seznam/Profil) –
      // ta zaslon ob fokusu (useFocusEffect) takoj naloži sveže podatke.
      navigation.goBack();
    } catch (e) {
      console.error('[AddPerson] napaka pri shranjevanju v Supabase:', e);
      Alert.alert('Napaka pri shranjevanju', describeError(e));
    } finally {
      setSaving(false);
      setSavePhase('idle');
    }
  };

  return (
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
          <Text style={styles.privacyText}>Zasebno – podatki so shranjeni samo na tvoji napravi.</Text>
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
              <Text style={styles.label}>Ime *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="npr. Marco"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View>
              <Text style={styles.label}>Priimek *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="npr. Rossi"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Lokacija */}
        <Text style={styles.sectionTitle}>Kje živi? *</Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.label}>Država</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Italija"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>Kraj</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Rim"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <Text style={styles.hint}>
          Koordinate se ob shranjevanju samodejno poiščejo (OpenStreetMap / Nominatim) glede na
          vpisano državo in kraj.
        </Text>

        {/* Kontakt */}
        <Text style={styles.sectionTitle}>Kontaktna platforma</Text>
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
        <Text style={styles.sectionTitle}>Fotografije</Text>
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
        <Text style={styles.hint}>Prva dodana slika je profilna; tu dodaš še skupne spominske slike.</Text>

        {/* Beležka */}
        <Text style={styles.sectionTitle}>Zaznamki / opombe</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={note}
          onChangeText={setNote}
          placeholder="Kje sta se spoznala, kaj sta počela skupaj, priporočila ..."
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
              ? 'Iščem lokacijo …'
              : savePhase === 'uploading'
                ? 'Nalagam fotografije …'
                : saving
                  ? 'Shranjujem …'
                  : 'Shrani v atlas'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48, gap: 8 },

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
