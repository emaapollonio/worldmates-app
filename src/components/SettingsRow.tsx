import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Vsebina na desni (npr. Switch ali besedilo) – privzeto puščica, če je vrstica pritisljiva. */
  right?: React.ReactNode;
};

/** Ena vrstica v seznamu nastavitev – ikona, besedilo, poljubna vsebina na desni. */
export default function SettingsRow({ icon, label, onPress, destructive, right }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tint = destructive ? colors.danger : colors.textPrimary;

  const content = (
    <View style={styles.row}>
      <Ionicons name={icon} size={19} color={tint} />
      <Text style={[styles.label, destructive && styles.labelDestructive]}>{label}</Text>
      <View style={styles.right}>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null)}
      </View>
    </View>
  );

  if (!onPress) return <View style={styles.card}>{content}</View>;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    cardPressed: { opacity: 0.7 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
    label: { flex: 1, fontSize: 15, color: colors.textPrimary },
    labelDestructive: { color: colors.danger, fontWeight: '600' },
    right: { flexDirection: 'row', alignItems: 'center' },
  });
