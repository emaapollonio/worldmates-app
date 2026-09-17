import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type MetStampBadgeProps = {
  /** Majhna caps oznaka na vrhu značke (npr. "MET") – neobvezna. */
  label?: string;
  /** Poudarjena glavna vrstica (npr. kraj srečanja ali ime države). */
  primary?: string | null;
  /** Manj poudarjena druga vrstica (npr. leto srečanja ali "×3"). */
  secondary?: string | null;
  /** Premer značke v px (privzeto 104) – uporabi manjšo za mrežo žigov na profilu. */
  size?: number;
};

/**
 * Okrogla, rahlo zavrtena "žig" značka – kot žig v potovalnem dnevniku.
 * Uporabljena za kraj/leto srečanja v PersonProfileScreen in za "zbirko
 * žigov" (država × št. oseb) v ProfileScreen.
 */
export default function MetStampBadge({ label, primary, secondary, size = 104 }: MetStampBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  return (
    <View style={styles.badge}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {primary ? (
        <Text style={styles.primaryText} numberOfLines={2}>
          {primary}
        </Text>
      ) : null}
      {secondary ? <Text style={styles.secondaryText}>{secondary}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors, size: number) => {
  const scale = size / 104;
  return StyleSheet.create({
    badge: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10 * scale,
      gap: 2,
      transform: [{ rotate: '-8deg' }],
    },
    label: {
      fontSize: 11 * scale,
      fontWeight: '800',
      letterSpacing: 1.5 * scale,
      color: colors.primary,
    },
    primaryText: {
      fontSize: 12 * scale,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    secondaryText: {
      fontSize: 11 * scale,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
};
