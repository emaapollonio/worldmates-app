import React, { useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Dodaten slog za zunanji ovoj – npr. absolutno pozicioniranje nad zemljevidom. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Skupna iskalna vrstica za ListScreen in MapScreen.
 * Sama ne filtrira – samo drži/oddaja besedilo, filtriranje naredi klicatelj
 * (glej `matchesQuery` v src/lib/people.ts), da je logika enotna na obeh zaslonih.
 */
export default function SearchBar({
  value,
  onChangeText,
  placeholder = STRINGS.searchBar.placeholder,
  containerStyle,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.searchBar.clearAccessibilityLabel}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      padding: 0,
    },
  });
