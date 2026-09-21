import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Alert, ActivityIndicator, Pressable, ScrollView, Switch, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import appConfig from '../../app.json';
import { supabase } from '../lib/supabase';
import { listPeople, computeStats, computeCountryCounts, type PeopleRow } from '../lib/people';
import { getProfile, updateProfile, type EditableProfileFields, type ProfileRow } from '../lib/profiles';
import { uploadAvatar } from '../lib/storage';
import { isBiometricAvailable, isBiometricLoginEnabled, setBiometricLoginEnabled } from '../lib/biometrics';
import { svgCountryName } from '../lib/continents';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';
import EditFieldModal from '../components/EditFieldModal';
import MetStampBadge from '../components/MetStampBadge';
import SettingsRow from '../components/SettingsRow';
import WorldMapHighlight from '../components/WorldMapHighlight';

type EditableField = 'display_name' | 'tagline' | 'home_country';

const FIELD_CONFIG: Record<EditableField, { title: string; placeholder: string }> = {
  display_name: { title: STRINGS.profile.editDisplayNameTitle, placeholder: STRINGS.profile.displayNamePlaceholder },
  tagline: { title: STRINGS.profile.editTaglineTitle, placeholder: STRINGS.profile.taglinePlaceholder },
  home_country: { title: STRINGS.profile.editHomeCountryTitle, placeholder: STRINGS.profile.homeCountryPlaceholder },
};

function StatCard({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricSupported);
    isBiometricLoginEnabled().then(setBiometricEnabled);
  }, []);

  const onToggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    await setBiometricLoginEnabled(value);
  };

  // Naloži ob vsakem fokusu, da profil/statistika po urejanju ostaneta sveža.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoadingStats(true);
        try {
          const { data: authData } = await supabase.auth.getUser();
          const uid = authData.user?.id ?? null;
          if (cancelled) return;
          setUserId(uid);
          setUserEmail(authData.user?.email ?? null);

          // allSettled namesto all: če ena od dveh poizvedb spodleti, druga
          // (uspešna) naj še vedno posodobi svoje stanje – sicer bi npr.
          // prehodna napaka pri getProfile pobrisala že naložene osebe in
          // statistika bi kazala 0, čeprav so podatki dejansko na voljo.
          const [profileResult, peopleResult] = await Promise.allSettled([
            uid ? getProfile(uid) : Promise.resolve(null),
            listPeople(),
          ]);
          if (cancelled) return;

          if (profileResult.status === 'fulfilled') {
            setProfile(profileResult.value);
          } else {
            console.error('[Profile] nalaganje profila ni uspelo:', profileResult.reason);
          }

          if (peopleResult.status === 'fulfilled') {
            setPeople(peopleResult.value);
          } else {
            console.error('[Profile] nalaganje oseb ni uspelo:', peopleResult.reason);
          }
        } catch (e) {
          console.error('[Profile] nalaganje ni uspelo:', e);
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
  const countryCounts = useMemo(() => computeCountryCounts(people), [people]);
  const knownCountryNames = useMemo(() => {
    const names = countryCounts.map(({ country }) => svgCountryName(country)).filter((n): n is string => !!n);
    return new Set(names);
  }, [countryCounts]);
  const emailPrefix = userEmail?.split('@')[0] ?? '';
  const displayName = profile?.display_name?.trim() || emailPrefix;

  const onChangeAvatar = async () => {
    if (!userId || uploadingAvatar) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(STRINGS.profile.avatarPermissionTitle, STRINGS.profile.avatarPermissionMessage);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (res.canceled) return;

      setUploadingAvatar(true);
      const avatarUrl = await uploadAvatar(res.assets[0].uri, userId);
      const updated = await updateProfile(userId, { avatar_url: avatarUrl });
      setProfile(updated);
      Toast.show({ type: 'success', text1: STRINGS.profile.avatarUpdatedToast, visibilityTime: 2000 });
    } catch (e) {
      console.error('[Profile] nalaganje profilne slike ni uspelo:', e);
      Alert.alert(STRINGS.common.error, STRINGS.profile.avatarUploadErrorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSaveField = async (value: string) => {
    if (!userId || !editingField) return;
    const field = editingField;
    setEditingField(null);
    try {
      const fields: EditableProfileFields = { [field]: value || null };
      const updated = await updateProfile(userId, fields);
      setProfile(updated);
    } catch (e) {
      console.error('[Profile] posodobitev profila ni uspela:', e);
      Alert.alert(STRINGS.common.error, STRINGS.profile.saveErrorMessage);
    }
  };

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>{STRINGS.profile.title}</Text>
      <Text style={styles.screenSubtitle}>{STRINGS.profile.subtitle}</Text>

      <View style={styles.avatarSection}>
        <Pressable
          onPress={onChangeAvatar}
          disabled={uploadingAvatar}
          style={styles.avatarWrap}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.profile.editAvatarAccessibilityLabel}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={44} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="camera" size={15} color={colors.onPrimary} />
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => setEditingField('display_name')}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.profile.editDisplayNameAccessibilityLabel}
        >
          <View style={styles.displayNameRow}>
            {displayName ? <Text style={styles.displayName}>{displayName}</Text> : null}
            <Ionicons name="pencil" size={14} color={colors.textMuted} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setEditingField('tagline')}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.profile.editTaglineAccessibilityLabel}
        >
          <Text style={profile?.tagline ? styles.tagline : styles.taglinePlaceholder}>
            {profile?.tagline || STRINGS.profile.addTaglinePlaceholder}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setEditingField('home_country')}
          style={styles.homeCountryRow}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.profile.editHomeCountryAccessibilityLabel}
        >
          <Ionicons name="home-outline" size={14} color={colors.textSecondary} />
          <Text style={profile?.home_country ? styles.homeCountry : styles.taglinePlaceholder}>
            {profile?.home_country || STRINGS.profile.addHomeCountryPlaceholder}
          </Text>
        </Pressable>
      </View>

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

      <View style={styles.stampsSection}>
        <Text style={styles.statsTitle}>{STRINGS.profile.stampsTitle}</Text>
        {!loadingStats && countryCounts.length === 0 ? (
          <Text style={styles.stampsEmpty}>{STRINGS.profile.stampsEmpty}</Text>
        ) : (
          <>
            <WorldMapHighlight knownCountryNames={knownCountryNames} />
            <View style={styles.stampsGrid}>
              {countryCounts.map(({ country, count }) => (
                <MetStampBadge key={country} primary={country} secondary={STRINGS.profile.stampCount(count)} size={72} />
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.statsTitle}>{STRINGS.profile.settingsTitle}</Text>
        <View style={styles.settingsList}>
          <SettingsRow
            icon="moon-outline"
            label={STRINGS.profile.darkModeLabel}
            onPress={() => setDarkMode(!isDarkMode)}
            right={
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            }
          />
          {biometricSupported ? (
            <SettingsRow
              icon="finger-print-outline"
              label={STRINGS.profile.biometricLabel}
              onPress={() => onToggleBiometric(!biometricEnabled)}
              right={
                <Switch
                  value={biometricEnabled}
                  onValueChange={onToggleBiometric}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.onPrimary}
                />
              }
            />
          ) : null}
          <SettingsRow
            icon="information-circle-outline"
            label={STRINGS.profile.aboutLabel}
            right={<Text style={styles.settingsValue}>{STRINGS.profile.aboutVersion(appConfig.expo.version)}</Text>}
          />
        </View>

        <View style={styles.logoutRow}>
          <SettingsRow icon="log-out-outline" label={STRINGS.profile.logoutButton} destructive onPress={onLogout} />
        </View>
      </View>

      <EditFieldModal
        visible={editingField !== null}
        title={editingField ? FIELD_CONFIG[editingField].title : ''}
        placeholder={editingField ? FIELD_CONFIG[editingField].placeholder : ''}
        value={editingField ? (profile?.[editingField] ?? '') : ''}
        onCancel={() => setEditingField(null)}
        onSave={onSaveField}
        placeAutocomplete={editingField === 'home_country'}
      />
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 40 },

    screenTitle: { fontFamily: FONT_SERIF_BOLD, fontSize: 24, color: colors.textPrimary, textAlign: 'center' },
    screenSubtitle: {
      marginTop: 6,
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },

    avatarSection: { alignItems: 'center', marginTop: 22 },
    avatarWrap: { width: 96, height: 96 },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceMuted },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarEditBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    displayName: { fontFamily: FONT_SERIF_BOLD, fontSize: 19, color: colors.textPrimary },
    tagline: { marginTop: 4, fontSize: 13, fontStyle: 'italic', color: colors.textSecondary, textAlign: 'center' },
    taglinePlaceholder: { marginTop: 4, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    homeCountryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    homeCountry: { fontSize: 13, color: colors.textSecondary },

    statsSection: { alignSelf: 'stretch', marginTop: 28 },
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

    stampsSection: { alignSelf: 'stretch', marginTop: 28 },
    stampsEmpty: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 12,
    },
    stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },

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

    settingsSection: {
      alignSelf: 'stretch',
      marginTop: 32,
      paddingTop: 20,
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderTopColor: colors.border,
    },
    settingsList: { gap: 10 },
    settingsValue: { fontSize: 14, color: colors.textSecondary },
    logoutRow: { marginTop: 20 },
  });
