import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
};

/**
 * Skupni "prazen zaslon" – uporablja se dokler zasloni nimajo prave vsebine.
 */
export default function ScreenPlaceholder({ title, subtitle, icon = 'ellipse-outline', children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

type PlaceholderButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
};

export function PlaceholderButton({ label, onPress, variant = 'primary' }: PlaceholderButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.buttonOutline : styles.buttonPrimary,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, isOutline && styles.buttonTextOutline]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    actions: {
      marginTop: 28,
      alignSelf: 'stretch',
      gap: 12,
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
    },
    buttonOutline: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    buttonTextOutline: {
      color: colors.textPrimary,
    },
  });
