import React, { useMemo } from 'react';
import { ScrollView, Pressable, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Vodoravna vrstica izbirnih tag chipov – skupna za ListScreen in MapScreen.
 * Izbira enega ali več tagov filtrira osebe, ki imajo VSAJ EN izbran tag
 * (glej matchesTags v src/lib/people.ts). Če ni nobenih tagov v bazi, se ne izriše nič.
 */
export default function TagFilterRow({ tags, selected, onToggle, containerStyle }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, containerStyle]}
    >
      {tags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => onToggle(tag)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: { gap: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: colors.onPrimary },
  });
