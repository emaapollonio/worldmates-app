import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';
import PlaceAutocompleteInput from './PlaceAutocompleteInput';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  placeholder?: string;
  onCancel: () => void;
  onSave: (value: string) => void;
  /** Predlogi krajev (Nominatim) med tipkanjem – ob izbiri se vpiše država ('country') ali ime naselja ('city'). */
  placeAutocomplete?: 'country' | 'city';
};

/**
 * Majhen modal za urejanje enega besedilnega polja (ime, tagline, domača
 * država na profilu) - Alert.prompt obstaja samo na iOS, zato lasten modal.
 */
export default function EditFieldModal({
  visible,
  title,
  value,
  placeholder,
  onCancel,
  onSave,
  placeAutocomplete,
}: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [draft, setDraft] = useState(value);

  // Ob vsakem odprtju modala ponastavi osnutek na trenutno vrednost polja.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {placeAutocomplete ? (
            <PlaceAutocompleteInput
              value={draft}
              onChangeText={setDraft}
              onSelectPlace={(place) => setDraft(placeAutocomplete === 'city' ? place.name : (place.country ?? place.name))}
              settlementsOnly={placeAutocomplete === 'city'}
              placeholder={placeholder}
            />
          ) : (
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCapitalize="sentences"
            />
          )}
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={onCancel}>
              <Text style={styles.btnText}>{STRINGS.common.cancel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
              onPress={() => onSave(draft.trim())}
            >
              <Text style={styles.btnPrimaryText}>{STRINGS.common.save}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      fontSize: 15,
      color: colors.textPrimary,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    btnPressed: { opacity: 0.7 },
    btnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    btnPrimary: { backgroundColor: colors.primary },
    btnPrimaryPressed: { backgroundColor: colors.primaryDark },
    btnPrimaryText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
  });
