import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type MetStampBadgeProps = {
  metLocation?: string | null;
  metDate?: string | null;
};

/** "YYYY-MM-DD" -> "YYYY" */
function yearFromDate(iso: string): string {
  return iso.slice(0, 4);
}

/**
 * Okrogla, rahlo zavrtena "žig" značka za kraj/leto srečanja – kot žig v
 * potovalnem dnevniku. Uporabljena v PersonProfileScreen namesto navadnega
 * besedilnega prikaza met_location/met_date.
 */
export default function MetStampBadge({ metLocation, metDate }: MetStampBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const year = metDate ? yearFromDate(metDate) : null;

  return (
    <View style={styles.badge}>
      <Text style={styles.metLabel}>MET</Text>
      {metLocation ? (
        <Text style={styles.locationText} numberOfLines={2}>
          {metLocation}
        </Text>
      ) : null}
      {year ? <Text style={styles.yearText}>{year}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    badge: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      gap: 2,
      transform: [{ rotate: '-8deg' }],
    },
    metLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.primary,
    },
    locationText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    yearText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
