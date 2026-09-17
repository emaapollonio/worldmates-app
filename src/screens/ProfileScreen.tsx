import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { supabase } from '../lib/supabase';
import { listPeople, computeStats, type PeopleRow } from '../lib/people';
import { getProfile, updateProfile, type ProfileRow } from '../lib/profiles';
import { uploadAvatar } from '../lib/storage';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [people, setPeople] = useState<PeopleRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

          const [profileRow, rows] = await Promise.all([
            uid ? getProfile(uid) : Promise.resolve(null),
            listPeople(),
          ]);
          if (cancelled) return;
          setProfile(profileRow);
          setPeople(rows);
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
        <Pressable onPress={onChangeAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
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
              <Ionicons
                name="camera"
                size={15}
                color={colors.onPrimary}
                accessibilityLabel={STRINGS.profile.editAvatarAccessibilityLabel}
              />
            )}
          </View>
        </Pressable>
        {displayName ? <Text style={styles.displayName}>{displayName}</Text> : null}
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

      <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>{STRINGS.profile.logoutButton}</Text>
      </Pressable>
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
    displayName: { marginTop: 12, fontFamily: FONT_SERIF_BOLD, fontSize: 19, color: colors.textPrimary },

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

    logoutBtn: {
      marginTop: 28,
      alignSelf: 'stretch',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    logoutBtnPressed: { opacity: 0.85 },
    logoutBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  });
