import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { searchPlaces, type PlaceSuggestion } from '../lib/geocoding';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 3;

type Props = Pick<TextInputProps, 'placeholder'> & {
  value: string;
  /** Kliče se ob vsakem ročnem tipkanju (izbira predloga kliče samo onSelectPlace). */
  onChangeText: (text: string) => void;
  /** Uporabnik je izbral predlog – vsebuje tudi točne koordinate iz Nominatim. */
  onSelectPlace: (place: PlaceSuggestion) => void;
  /** Samo naselja (mesta/vasi) – za polje "kraj". */
  settlementsOnly?: boolean;
  /** Samo države – za polje "država". */
  countriesOnly?: boolean;
  /** Sporočilo o napaki pod poljem (npr. vnos ni bil izbran s seznama predlogov). */
  error?: string | null;
};

/**
 * Tekstno polje s predlogi krajev (Nominatim) pod njim: debounce 450 ms,
 * največ 5 predlogov z regijo/državo za razločevanje istoimenskih krajev.
 */
export default function PlaceAutocompleteInput({
  value,
  onChangeText,
  onSelectPlace,
  placeholder,
  settlementsOnly,
  countriesOnly,
  error,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  /** Iskanje je uspelo, a ni vrnilo nobenega zadetka – uporabniku povemo, da vnosa ne bo mogoče izbrati. */
  const [noResults, setNoResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  const handleChange = (text: string) => {
    onChangeText(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    setNoResults(false);

    if (text.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchPlaces(text.trim(), { settlementsOnly, countriesOnly, signal: controller.signal });
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setNoResults(results.length === 0);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.warn('[PlaceAutocomplete] iskanje ni uspelo:', e);
          setSuggestions([]);
        }
      }
    }, DEBOUNCE_MS);
  };

  const handleSelect = (place: PlaceSuggestion) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    setSuggestions([]);
    setNoResults(false);
    onSelectPlace(place);
  };

  return (
    <View>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
      />
      {suggestions.length > 0 ? (
        <View style={styles.list}>
          {suggestions.map((s, i) => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [styles.item, i > 0 && styles.itemBorder, pressed && styles.itemPressed]}
              onPress={() => handleSelect(s)}
              accessibilityRole="button"
              accessibilityLabel={s.label}
            >
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.itemText} numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {noResults && suggestions.length === 0 ? <Text style={styles.noResults}>{STRINGS.common.noPlacesFound}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      fontSize: 15,
      color: colors.textPrimary,
    },
    inputError: { borderColor: colors.danger },
    errorText: { marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.danger },
    noResults: { marginTop: 6, fontSize: 12, color: colors.textSecondary },
    list: {
      marginTop: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 12 },
    itemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    itemPressed: { backgroundColor: colors.surfaceMuted },
    itemText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  });
