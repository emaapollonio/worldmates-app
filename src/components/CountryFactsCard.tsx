import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from './AppText';
import { getCountryFacts } from '../lib/countryFacts';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

type Props = {
  country: string;
  /** Čigava država je to: "Lives in" / "Met in". */
  role: 'home' | 'met';
};

type Row = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string };

/**
 * Majhna kartica z zanimivostmi o državi (prestolnica, jeziki, valute, zastava).
 * Ne prikaže ničesar, če države ni v naboru (npr. prosto vpisan kraj iz starih zapisov).
 */
export default function CountryFactsCard({ country, role }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const facts = useMemo(() => getCountryFacts(country), [country]);

  if (!facts) return null;

  const T = STRINGS.countryFacts;
  const rows: Row[] = [];
  if (facts.capitals.length > 0) {
    rows.push({
      icon: 'business-outline',
      label: facts.capitals.length > 1 ? T.capitals : T.capital,
      value: facts.capitals.join(', '),
    });
  }
  if (facts.languages.length > 0) {
    rows.push({
      icon: 'chatbubbles-outline',
      label: facts.languages.length > 1 ? T.languages : T.language,
      value: facts.languages.join(', '),
    });
  }
  if (facts.currencies.length > 0) {
    rows.push({
      icon: 'cash-outline',
      label: facts.currencies.length > 1 ? T.currencies : T.currency,
      value: facts.currencies.map((c) => (c.symbol ? `${c.name} (${c.symbol})` : c.name)).join(', '),
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.flag} accessibilityLabel={T.flagAccessibilityLabel(facts.name)}>
          {facts.flag}
        </Text>
        <View style={styles.headerText}>
          <Text style={styles.role}>{role === 'home' ? T.livesIn : T.metIn}</Text>
          <Text style={styles.country}>{facts.name}</Text>
        </View>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Ionicons name={row.icon} size={16} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={styles.rowValue}>{row.value}</Text>
        </View>
      ))}
      <Text style={styles.source}>{T.source}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      gap: 8,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
    flag: { fontSize: 30 },
    headerText: { flex: 1 },
    role: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textSecondary },
    country: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    rowLabel: { width: 108, fontSize: 13, color: colors.textSecondary },
    rowValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    source: { marginTop: 2, fontSize: 10, color: colors.textSecondary },
  });
