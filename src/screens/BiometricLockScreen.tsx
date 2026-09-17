import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { authenticateWithBiometrics } from '../lib/biometrics';
import { STRINGS } from '../constants/strings';

type Props = {
  onUnlocked: () => void;
  onLogout: () => void;
};

/**
 * Prikazan namesto glavne app ob zagonu, če je uporabnik v nastavitvah
 * vklopil biometrično odklepanje IN ima že shranjeno (veljavno) sejo –
 * potrditev z Face ID/prstnim odtisom nadomesti ponoven vnos gesla.
 */
export default function BiometricLockScreen({ onUnlocked, onLogout }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [authenticating, setAuthenticating] = useState(false);
  const [failed, setFailed] = useState(false);

  const attempt = useCallback(async () => {
    setAuthenticating(true);
    setFailed(false);
    try {
      const success = await authenticateWithBiometrics(STRINGS.auth.biometricPromptMessage);
      if (success) onUnlocked();
      else setFailed(true);
    } catch (e) {
      console.error('[BiometricLock] avtentikacija ni uspela:', e);
      setFailed(true);
    } finally {
      setAuthenticating(false);
    }
  }, [onUnlocked]);

  // Samodejno poskusi takoj ob prikazu, da uporabniku ni treba najprej tapniti gumba.
  useEffect(() => {
    attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="finger-print" size={44} color={colors.primary} />
        </View>
        <Text style={styles.title}>{STRINGS.auth.biometricLockTitle}</Text>
        <Text style={styles.description}>{STRINGS.auth.biometricLockDescription}</Text>

        {failed ? <Text style={styles.errorText}>{STRINGS.auth.biometricFailedMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={attempt}
          disabled={authenticating}
        >
          {authenticating ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryBtnText}>{STRINGS.auth.biometricUnlockButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.logoutLink} onPress={onLogout}>
          <Text style={styles.logoutLinkText}>{STRINGS.auth.biometricLogoutInstead}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: { fontFamily: FONT_SERIF_BOLD, fontSize: 22, color: colors.textPrimary, textAlign: 'center' },
    description: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 280,
    },
    errorText: { marginTop: 16, fontSize: 13, color: colors.danger, textAlign: 'center' },

    primaryBtn: {
      marginTop: 28,
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnPressed: { backgroundColor: colors.primaryDark },
    primaryBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },

    logoutLink: { marginTop: 16 },
    logoutLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  });
