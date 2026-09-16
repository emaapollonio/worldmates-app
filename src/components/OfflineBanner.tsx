import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

/**
 * Majhna, neopazna oznaka – prikazana, ko nalaganje iz Supabase spodleti,
 * a imamo shranjen cache (glej src/lib/offlineCache.ts), zato obdržimo prikaz
 * zadnjih znanih podatkov namesto napake.
 */
export default function OfflineBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color={colors.textSecondary} />
      <Text style={styles.text}>{STRINGS.common.offlineBanner}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    text: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  });
